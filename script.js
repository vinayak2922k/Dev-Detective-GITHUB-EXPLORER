// script.js — Main application orchestration & event wiring

'use strict';

// DOM Elements
const tabSearch = document.getElementById('tab-search');
const tabBattle = document.getElementById('tab-battle');
const viewSearch = document.getElementById('view-search');
const viewBattle = document.getElementById('view-battle');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchSubmitBtn = document.getElementById('search-submit-btn');
const searchValidationMsg = document.getElementById('search-validation-msg');

const searchLoading = document.getElementById('search-loading');
const searchError = document.getElementById('search-error');
const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const errorRetryBtn = document.getElementById('error-retry-btn');
const searchInitial = document.getElementById('search-initial');
const searchResultContainer = document.getElementById('search-result-container');
const profileCardMount = document.getElementById('profile-card-mount');

const reposGrid = document.getElementById('repos-grid');
const reposLoading = document.getElementById('repos-loading');
const reposError = document.getElementById('repos-error');
const reposErrorDesc = document.getElementById('repos-error-desc');
const reposEmpty = document.getElementById('repos-empty');

const battleForm = document.getElementById('battle-form');
const battleUserA = document.getElementById('battle-user-a');
const battleUserB = document.getElementById('battle-user-b');
const battleSubmitBtn = document.getElementById('battle-submit-btn');
const battleValidationMsg = document.getElementById('battle-validation-msg');
const battleLoading = document.getElementById('battle-loading');
const battleLoadingDesc = document.getElementById('battle-loading-desc');
const battleError = document.getElementById('battle-error');
const battleErrorTitle = document.getElementById('battle-error-title');
const battleErrorDesc = document.getElementById('battle-error-desc');
const battleResultContainer = document.getElementById('battle-result-container');

// Mode Switcher
function switchMode(mode) {
  const isSearch = mode === 'search';

  // Update tabs active state & accessibility
  if (tabSearch) {
    tabSearch.classList.toggle('active', isSearch);
    tabSearch.setAttribute('aria-selected', isSearch ? 'true' : 'false');
  }
  if (tabBattle) {
    tabBattle.classList.toggle('active', !isSearch);
    tabBattle.setAttribute('aria-selected', !isSearch ? 'true' : 'false');
  }

  // Update view sections: ensure class, attribute, and visibility are synchronized
  if (viewSearch) {
    viewSearch.classList.toggle('active', isSearch);
    viewSearch.classList.toggle('hidden', !isSearch);
    viewSearch.hidden = !isSearch;
  }
  if (viewBattle) {
    viewBattle.classList.toggle('active', !isSearch);
    viewBattle.classList.toggle('hidden', isSearch);
    viewBattle.hidden = isSearch;
  }

  // Smooth scroll to top of view
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Accessibility focus management
  if (isSearch) {
    if (searchInput) setTimeout(() => searchInput.focus(), 60);
  } else {
    if (battleUserA) setTimeout(() => battleUserA.focus(), 60);
  }
}

if (tabSearch) tabSearch.addEventListener('click', () => switchMode('search'));
if (tabBattle) tabBattle.addEventListener('click', () => switchMode('battle'));

// Search Handler
async function handleSearch(rawUser) {
  const user = (rawUser || '').trim();
  if (!user) {
    searchValidationMsg.textContent = 'Please enter a valid GitHub username to search.';
    searchValidationMsg.classList.remove('hidden');
    searchInput.focus();
    return;
  }

  searchValidationMsg.classList.add('hidden');
  searchSubmitBtn.disabled = true;
  searchSubmitBtn.querySelector('.btn-text').classList.add('hidden');
  searchSubmitBtn.querySelector('.btn-spinner').classList.remove('hidden');

  searchLoading.classList.remove('hidden');
  searchError.classList.add('hidden');
  searchInitial.classList.add('hidden');
  searchResultContainer.classList.add('hidden');

  try {
    const profile = await fetchGitHubUser(user);
    renderProfile(profile, profileCardMount);
    searchResultContainer.classList.remove('hidden');

    // Fetch repositories independently
    reposLoading.classList.remove('hidden');
    reposError.classList.add('hidden');
    reposEmpty.classList.add('hidden');

    try {
      const repos = await fetchUserRepositories(profile.repos_url);
      renderRepositories(repos, reposGrid, reposEmpty);
    } catch (repoErr) {
      reposGrid.innerHTML = '';
      reposError.classList.remove('hidden');
      reposErrorDesc.textContent = repoErr.message || 'Unable to fetch recent repositories.';
    } finally {
      reposLoading.classList.add('hidden');
    }
  } catch (err) {
    searchError.classList.remove('hidden');
    errorTitle.textContent = err.status === 404 ? 'Developer not found.' : 'Search error.';
    errorDesc.textContent = err.message || 'Please check username or connection.';
  } finally {
    searchLoading.classList.add('hidden');
    searchSubmitBtn.disabled = false;
    searchSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
    searchSubmitBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
}

// Battle Handler
async function handleBattleSubmit(e) {
  if (e) e.preventDefault();
  const userA = battleUserA.value.trim();
  const userB = battleUserB.value.trim();

  if (!userA || !userB) {
    battleValidationMsg.textContent = 'Please enter GitHub usernames for both Developer A and Developer B.';
    battleValidationMsg.classList.remove('hidden');
    return;
  }
  if (userA.toLowerCase() === userB.toLowerCase()) {
    battleValidationMsg.textContent = 'Please enter two distinct developer usernames to compare.';
    battleValidationMsg.classList.remove('hidden');
    return;
  }

  battleValidationMsg.classList.add('hidden');
  battleSubmitBtn.disabled = true;
  battleSubmitBtn.querySelector('.btn-text').classList.add('hidden');
  battleSubmitBtn.querySelector('.btn-spinner').classList.remove('hidden');

  battleLoading.classList.remove('hidden');
  battleError.classList.add('hidden');
  battleResultContainer.classList.add('hidden');

  try {
    // 1. Fetch profiles in parallel with Promise.all
    const [profileA, profileB] = await Promise.all([
      fetchGitHubUser(userA).catch(err => { err.side = `Developer A (${userA})`; throw err; }),
      fetchGitHubUser(userB).catch(err => { err.side = `Developer B (${userB})`; throw err; })
    ]);

    // 2. Fetch repos in parallel with Promise.all
    battleLoadingDesc.textContent = 'Summing repository stars using reduce()...';
    const [reposDataA, reposDataB] = await Promise.all([
      fetchAllUserRepositoriesForBattle(profileA.repos_url, profileA.public_repos),
      fetchAllUserRepositoriesForBattle(profileB.repos_url, profileB.public_repos)
    ]);

    // 3. Compute stars with reduce
    const starsA = calculateTotalStars(reposDataA.repositories);
    const starsB = calculateTotalStars(reposDataB.repositories);

    renderBattleResults(
      { user: profileA, totalStars: starsA },
      { user: profileB, totalStars: starsB },
      battleResultContainer
    );
  } catch (err) {
    battleError.classList.remove('hidden');
    battleErrorTitle.textContent = err.status === 404 ? 'Developer Not Found' : 'Battle Error';
    battleErrorDesc.textContent = err.side ? `${err.side} not found on GitHub.` : err.message;
  } finally {
    battleLoading.classList.add('hidden');
    battleSubmitBtn.disabled = false;
    battleSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
    battleSubmitBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
}

// Event Listeners
searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(searchInput.value); });

searchInput.addEventListener('input', () => {
  searchClearBtn.classList.toggle('hidden', !searchInput.value.trim());
  searchValidationMsg.classList.add('hidden');
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.add('hidden');
  searchInput.focus();
  searchValidationMsg.classList.add('hidden');
});

errorRetryBtn.addEventListener('click', () => {
  searchError.classList.add('hidden');
  searchInitial.classList.remove('hidden');
  searchInput.focus();
});

document.querySelectorAll('.chip-btn[data-username]').forEach(chip => {
  chip.addEventListener('click', () => {
    searchInput.value = chip.dataset.username;
    searchClearBtn.classList.remove('hidden');
    handleSearch(chip.dataset.username);
  });
});

battleForm.addEventListener('submit', handleBattleSubmit);

document.querySelectorAll('.battle-preset-btn').forEach(preset => {
  preset.addEventListener('click', () => {
    battleUserA.value = preset.dataset.userA;
    battleUserB.value = preset.dataset.userB;
    handleBattleSubmit();
  });
});

// Footer Navigation & Dynamic Year
const currentYearSpan = document.getElementById('current-year');
if (currentYearSpan) {
  currentYearSpan.textContent = new Date().getFullYear();
}

document.getElementById('footer-brand-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  switchMode('search');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('footer-link-search')?.addEventListener('click', () => {
  switchMode('search');
  searchInput.focus();
  searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('footer-link-battle')?.addEventListener('click', () => {
  switchMode('battle');
  battleUserA.focus();
  battleForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('footer-link-repos')?.addEventListener('click', () => {
  switchMode('search');
  const reposSection = document.querySelector('.repos-section');
  if (reposSection) {
    reposSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

document.getElementById('footer-link-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// URL Hash routing support (e.g. #battle, #search)
function checkInitialHash() {
  const hash = (window.location.hash || '').toLowerCase();
  if (hash === '#battle' || hash === '#view-battle') {
    switchMode('battle');
  } else if (hash === '#search' || hash === '#view-search') {
    switchMode('search');
  }
}

window.addEventListener('hashchange', checkInitialHash);
if (window.location.hash) {
  checkInitialHash();
}

