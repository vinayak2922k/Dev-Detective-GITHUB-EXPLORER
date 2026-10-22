/**
 * Dev-Detective — GitHub Profile Explorer & Battle Mode
 * Prodesk IT Sprint 03 Assignment: "The API Hunter"
 * 
 * Tech stack: Pure Vanilla JavaScript (ES6+), HTML5, CSS3.
 * Core features:
 * - Native Fetch API with async/await, try/catch/finally
 * - Real GitHub REST API endpoints
 * - Date formatting via Intl.DateTimeFormat
 * - Robust error handling (404, 403, network, etc.)
 * - DOM construction using createElement and textContent (XSS-safe)
 * - Head-to-head Battle Mode with Promise.all() and Array.prototype.reduce()
 */

// Strict mode for enhanced code safety
'use strict';

/* ==========================================================================
   1. DOM ELEMENT REFERENCES
   ========================================================================== */

// Navigation & Tabs
const tabSearch = document.getElementById('tab-search');
const tabBattle = document.getElementById('tab-battle');
const viewSearch = document.getElementById('view-search');
const viewBattle = document.getElementById('view-battle');

// Profile Search Form & Inputs
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const searchSubmitBtn = document.getElementById('search-submit-btn');
const searchValidationMsg = document.getElementById('search-validation-msg');

// Profile Search States & Containers
const searchLoading = document.getElementById('search-loading');
const searchError = document.getElementById('search-error');
const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const errorRetryBtn = document.getElementById('error-retry-btn');
const searchInitial = document.getElementById('search-initial');
const searchResultContainer = document.getElementById('search-result-container');
const profileCardMount = document.getElementById('profile-card-mount');

// Repositories Section
const reposGrid = document.getElementById('repos-grid');
const reposLoading = document.getElementById('repos-loading');
const reposError = document.getElementById('repos-error');
const reposErrorDesc = document.getElementById('repos-error-desc');
const reposEmpty = document.getElementById('repos-empty');

// Battle Mode Elements
const battleForm = document.getElementById('battle-form');
const battleUserA = document.getElementById('battle-user-a');
const battleUserB = document.getElementById('battle-user-b');
const battleSubmitBtn = document.getElementById('battle-submit-btn');
const battleValidationMsg = document.getElementById('battle-validation-msg');
const battleLoading = document.getElementById('battle-loading');
const battleLoadingTitle = document.getElementById('battle-loading-title');
const battleLoadingDesc = document.getElementById('battle-loading-desc');
const battleError = document.getElementById('battle-error');
const battleErrorTitle = document.getElementById('battle-error-title');
const battleErrorDesc = document.getElementById('battle-error-desc');
const battleResultContainer = document.getElementById('battle-result-container');

// Screen Reader Announcer
const ariaStatusAnnouncer = document.getElementById('aria-status-announcer');

/* ==========================================================================
   2. APPLICATION STATE
   ========================================================================== */
const state = {
  currentMode: 'search', // 'search' | 'battle'
  isSearching: false,
  isBattling: false,
  lastSearchedUser: null
};

/* ==========================================================================
   3. UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Formats an ISO 8601 date timestamp into "DD Mon YYYY" (e.g. "25 Jan 2023").
 * Uses native Intl.DateTimeFormat.
 * 
 * @param {string} isoString - ISO date string from GitHub API.
 * @returns {string} Human-readable date string or "N/A".
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (err) {
    return 'N/A';
  }
}

/**
 * Normalizes an external website/portfolio URL.
 * Ensures the URL starts with http:// or https://.
 * 
 * @param {string} url - Raw URL string from user profile.
 * @returns {string|null} Normalized URL or null if invalid/empty.
 */
function normalizeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Announces status changes to screen readers via aria-live.
 * 
 * @param {string} message - Message to announce.
 */
function announceToScreenReader(message) {
  if (ariaStatusAnnouncer) {
    ariaStatusAnnouncer.textContent = message;
  }
}

/**
 * Formats large numbers with comma separators (e.g. 12,450).
 * 
 * @param {number} num - Raw number.
 * @returns {string} Formatted number.
 */
function formatNumber(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

/* ==========================================================================
   4. GITHUB API SERVICE FUNCTIONS
   ========================================================================== */

/**
 * Fetches a GitHub user profile by username.
 * Uses native Fetch API with explicit response.ok checking and HTTP status handling.
 * 
 * @param {string} username - GitHub username.
 * @returns {Promise<Object>} User profile object.
 * @throws {Error} User-friendly error with status code and context.
 */
async function fetchGitHubUser(username) {
  const cleanUsername = encodeURIComponent(username.trim());
  const endpoint = `https://api.github.com/users/${cleanUsername}`;

  const response = await fetch(endpoint, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error(`Developer "${username}" not found.`);
      error.status = 404;
      throw error;
    } else if (response.status === 403) {
      let msg = 'GitHub API rate limit exceeded or access restricted. Please try again later.';
      try {
        const body = await response.json();
        if (body && body.message && body.message.toLowerCase().includes('rate limit')) {
          msg = 'GitHub API rate limit exceeded (60 requests/hr for unauthenticated users). Please wait a few minutes before trying again.';
        }
      } catch (_) {}
      const error = new Error(msg);
      error.status = 403;
      throw error;
    } else if (response.status === 429) {
      const error = new Error('Too many requests. Please wait a moment before searching again.');
      error.status = 429;
      throw error;
    } else if (response.status >= 500) {
      const error = new Error('GitHub servers are currently experiencing issues. Please try again shortly.');
      error.status = response.status;
      throw error;
    } else {
      const error = new Error(`GitHub API request failed with status: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }

  return await response.json();
}

/**
 * Fetches the user's latest repositories using the user's official repos_url.
 * Fetches up to 100 repositories, sorts them client-side by updated_at descending,
 * and extracts the top 5 most recently active repositories.
 * 
 * @param {string} reposUrl - Official repos_url provided in GitHub profile.
 * @returns {Promise<Array>} Top 5 most recently updated repositories.
 */
async function fetchUserRepositories(reposUrl) {
  if (!reposUrl) return [];

  // Query parameters: sort=updated, direction=desc, per_page=100
  const url = new URL(reposUrl);
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('direction', 'desc');
  url.searchParams.set('per_page', '100');

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load repositories (HTTP ${response.status})`);
  }

  const repos = await response.json();

  if (!Array.isArray(repos)) {
    return [];
  }

  // Ensure deterministic client-side sorting by updated_at timestamp in descending order
  const sortedRepos = repos.slice().sort((a, b) => {
    const dateA = new Date(a.updated_at || 0).getTime();
    const dateB = new Date(b.updated_at || 0).getTime();
    return dateB - dateA;
  });

  // Extract the top 5 most recently updated repositories
  return sortedRepos.slice(0, 5);
}

/**
 * Fetches all public repositories for Battle Mode to calculate total stars.
 * Handles GitHub pagination safely (respecting API rate limits, fetching up to
 * 300 repositories / 3 pages if the user has many public repos).
 * 
 * @param {string} reposUrl - Official repos_url from user profile.
 * @param {number} publicReposCount - Total public repositories count.
 * @returns {Promise<{repositories: Array, isComplete: boolean}>}
 */
async function fetchAllUserRepositoriesForBattle(reposUrl, publicReposCount) {
  if (!reposUrl || publicReposCount === 0) {
    return { repositories: [], isComplete: true };
  }

  const perPage = 100;
  // Limit to max 3 pages (300 repos) to avoid exhausting unauthenticated rate limits (60 req/hr)
  const maxPages = Math.min(Math.ceil(publicReposCount / perPage), 3);
  let allRepos = [];
  let isComplete = publicReposCount <= perPage * maxPages;

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(reposUrl);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      // If first page fails, throw error. If subsequent page fails, return whatever gathered with complete=false
      if (page === 1) {
        throw new Error(`Failed to fetch repositories (HTTP ${response.status})`);
      }
      isComplete = false;
      break;
    }

    const repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      break;
    }

    allRepos = allRepos.concat(repos);

    // If returned items is less than perPage, we reached the last page
    if (repos.length < perPage) {
      isComplete = true;
      break;
    }
  }

  return { repositories: allRepos, isComplete };
}

/**
 * Calculates total stars across an array of repositories using Array.prototype.reduce().
 * Safely handles null/undefined values and empty arrays.
 * 
 * @param {Array} repositories - Array of repository objects.
 * @returns {number} Total stars count.
 */
function calculateTotalStars(repositories) {
  if (!Array.isArray(repositories) || repositories.length === 0) {
    return 0;
  }

  return repositories.reduce((total, repo) => {
    const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
    return total + stars;
  }, 0);
}

/* ==========================================================================
   5. PROFILE & REPOSITORY DOM RENDERING (XSS-SAFE)
   ========================================================================== */

/**
 * Creates SVG icon elements safely.
 * 
 * @param {string} iconName - Identifier for the icon.
 * @returns {SVGElement} SVG DOM element.
 */
function createSvgIcon(iconName) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  if (iconName === 'calendar') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '3');
    rect.setAttribute('y', '4');
    rect.setAttribute('width', '18');
    rect.setAttribute('height', '18');
    rect.setAttribute('rx', '2');
    rect.setAttribute('ry', '2');
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '16');
    line1.setAttribute('y1', '2');
    line1.setAttribute('x2', '16');
    line1.setAttribute('y2', '6');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '8');
    line2.setAttribute('y1', '2');
    line2.setAttribute('x2', '8');
    line2.setAttribute('y2', '6');
    const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line3.setAttribute('x1', '3');
    line3.setAttribute('y1', '10');
    line3.setAttribute('x2', '21');
    line3.setAttribute('y2', '10');
    svg.append(rect, line1, line2, line3);
  } else if (iconName === 'external') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '15 3 21 3 21 9');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '10');
    line.setAttribute('y1', '14');
    line.setAttribute('x2', '21');
    line.setAttribute('y2', '3');
    svg.append(path, polyline, line);
  } else if (iconName === 'location') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '10');
    circle.setAttribute('r', '3');
    svg.append(path, circle);
  } else if (iconName === 'company') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2');
    svg.append(path);
  } else if (iconName === 'link') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');
    svg.append(path, path2);
  } else if (iconName === 'star') {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2');
    svg.append(polygon);
  } else if (iconName === 'fork') {
    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '12');
    circle1.setAttribute('cy', '18');
    circle1.setAttribute('r', '3');
    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle2.setAttribute('cx', '6');
    circle2.setAttribute('cy', '6');
    circle2.setAttribute('r', '3');
    const circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle3.setAttribute('cx', '18');
    circle3.setAttribute('cy', '6');
    circle3.setAttribute('r', '3');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9M12 12v3');
    svg.append(circle1, circle2, circle3, path);
  }

  return svg;
}

/**
 * Safely renders the complete GitHub Profile Card using DOM manipulation.
 * Avoids any direct innerHTML injection of untrusted API content.
 * 
 * @param {Object} user - User profile data object from GitHub API.
 */
function renderProfile(user) {
  profileCardMount.innerHTML = '';

  const card = document.createElement('article');
  card.className = 'profile-card';
  card.setAttribute('aria-label', `Profile of ${user.name || user.login}`);

  // 1. Header (Avatar + Names + Joined Date + Link)
  const header = document.createElement('div');
  header.className = 'profile-header';

  // Avatar with fallback
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'profile-avatar-wrapper';

  const avatarImg = document.createElement('img');
  avatarImg.className = 'profile-avatar';
  avatarImg.src = user.avatar_url || '';
  avatarImg.alt = `${user.name || user.login}'s profile avatar`;
  avatarImg.loading = 'lazy';
  avatarImg.onerror = function() {
    avatarImg.remove();
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.textContent = (user.name || user.login || '?').charAt(0).toUpperCase();
    avatarWrapper.appendChild(fallback);
  };
  avatarWrapper.appendChild(avatarImg);

  // Names & Dates
  const namesWrapper = document.createElement('div');
  namesWrapper.className = 'profile-names-wrapper';

  const nameRow = document.createElement('div');
  nameRow.className = 'profile-name-row';

  const nameHeading = document.createElement('h2');
  nameHeading.className = 'profile-name';
  nameHeading.textContent = user.name || user.login;

  const joinDate = document.createElement('div');
  joinDate.className = 'profile-join-date';
  joinDate.appendChild(createSvgIcon('calendar'));
  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Joined ${formatDate(user.created_at)}`;
  joinDate.appendChild(dateSpan);

  nameRow.append(nameHeading, joinDate);

  const loginSpan = document.createElement('span');
  loginSpan.className = 'profile-username';
  loginSpan.textContent = `@${user.login}`;

  // GitHub Link Action
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'profile-actions';

  const githubLink = document.createElement('a');
  githubLink.className = 'btn-github-link';
  githubLink.href = user.html_url;
  githubLink.target = '_blank';
  githubLink.rel = 'noopener noreferrer';
  githubLink.appendChild(createSvgIcon('external'));
  const linkText = document.createElement('span');
  linkText.textContent = 'View on GitHub';
  githubLink.appendChild(linkText);
  actionsDiv.appendChild(githubLink);

  namesWrapper.append(nameRow, loginSpan, actionsDiv);
  header.append(avatarWrapper, namesWrapper);

  // 2. Bio Box
  const bioBox = document.createElement('div');
  bioBox.className = 'profile-bio';
  if (user.bio && user.bio.trim()) {
    bioBox.textContent = user.bio.trim();
  } else {
    bioBox.className += ' bio-empty';
    bioBox.textContent = 'This developer has not provided a biography yet.';
  }

  // 3. Stats Dashboard Grid
  const statsGrid = document.createElement('div');
  statsGrid.className = 'profile-stats-grid';

  const statsData = [
    { label: 'Repositories', value: user.public_repos ?? 0 },
    { label: 'Followers', value: user.followers ?? 0 },
    { label: 'Following', value: user.following ?? 0 },
    { label: 'Public Gists', value: user.public_gists ?? 0 }
  ];

  statsData.forEach(stat => {
    const item = document.createElement('div');
    item.className = 'stat-item';

    const lbl = document.createElement('span');
    lbl.className = 'stat-label';
    lbl.textContent = stat.label;

    const val = document.createElement('span');
    val.className = 'stat-value';
    val.textContent = formatNumber(stat.value);

    item.append(lbl, val);
    statsGrid.appendChild(item);
  });

  // 4. Metadata Grid (Location, Company, Portfolio Website)
  const metaGrid = document.createElement('div');
  metaGrid.className = 'profile-meta-grid';

  // Location
  const locItem = document.createElement('div');
  locItem.className = 'meta-item';
  locItem.appendChild(createSvgIcon('location'));
  const locVal = document.createElement('span');
  locVal.className = 'meta-value';
  if (user.location && user.location.trim()) {
    locVal.textContent = user.location.trim();
  } else {
    locVal.className += ' meta-empty';
    locVal.textContent = 'Not specified';
  }
  locItem.appendChild(locVal);

  // Company
  const compItem = document.createElement('div');
  compItem.className = 'meta-item';
  compItem.appendChild(createSvgIcon('company'));
  const compVal = document.createElement('span');
  compVal.className = 'meta-value';
  if (user.company && user.company.trim()) {
    compVal.textContent = user.company.trim();
  } else {
    compVal.className += ' meta-empty';
    compVal.textContent = 'Not specified';
  }
  compItem.appendChild(compVal);

  // Portfolio / Website
  const blogItem = document.createElement('div');
  blogItem.className = 'meta-item';
  blogItem.appendChild(createSvgIcon('link'));
  const normalizedBlog = normalizeUrl(user.blog);

  if (normalizedBlog) {
    const blogLink = document.createElement('a');
    blogLink.className = 'meta-value meta-link';
    blogLink.href = normalizedBlog;
    blogLink.target = '_blank';
    blogLink.rel = 'noopener noreferrer';
    blogLink.textContent = user.blog.trim();
    blogItem.appendChild(blogLink);
  } else {
    const blogEmpty = document.createElement('span');
    blogEmpty.className = 'meta-value meta-empty';
    blogEmpty.textContent = 'No portfolio provided';
    blogItem.appendChild(blogEmpty);
  }

  metaGrid.append(locItem, compItem, blogItem);

  // Assemble Profile Card
  card.append(header, bioBox, statsGrid, metaGrid);
  profileCardMount.appendChild(card);
}

/**
 * Safely renders the latest 5 repositories into the repository grid.
 * 
 * @param {Array} repos - Array of repository objects.
 */
function renderRepositories(repos) {
  reposGrid.innerHTML = '';

  if (!repos || repos.length === 0) {
    reposEmpty.classList.remove('hidden');
    return;
  }

  reposEmpty.classList.add('hidden');

  repos.forEach(repo => {
    const card = document.createElement('article');
    card.className = 'repo-card';

    // Top: Repo Name Link
    const topDiv = document.createElement('div');
    topDiv.className = 'repo-card-top';

    const nameLink = document.createElement('a');
    nameLink.className = 'repo-name-link';
    nameLink.href = repo.html_url;
    nameLink.target = '_blank';
    nameLink.rel = 'noopener noreferrer';
    nameLink.textContent = repo.name;
    topDiv.appendChild(nameLink);

    // Description
    const desc = document.createElement('p');
    desc.className = 'repo-description';
    if (repo.description && repo.description.trim()) {
      desc.textContent = repo.description.trim();
    } else {
      desc.className += ' desc-empty';
      desc.textContent = 'No repository description provided.';
    }

    // Footer: Metrics & Updated Date
    const footer = document.createElement('div');
    footer.className = 'repo-footer';

    const metrics = document.createElement('div');
    metrics.className = 'repo-metrics';

    // Primary Language Tag
    if (repo.language) {
      const langTag = document.createElement('span');
      langTag.className = 'repo-language-tag';
      const dot = document.createElement('span');
      dot.className = 'language-dot';
      const langName = document.createElement('span');
      langName.textContent = repo.language;
      langTag.append(dot, langName);
      metrics.appendChild(langTag);
    }

    // Stars
    const starItem = document.createElement('span');
    starItem.className = 'repo-metric-item repo-star';
    starItem.appendChild(createSvgIcon('star'));
    const starCount = document.createElement('span');
    starCount.textContent = formatNumber(repo.stargazers_count ?? 0);
    starItem.appendChild(starCount);

    // Forks
    const forkItem = document.createElement('span');
    forkItem.className = 'repo-metric-item repo-fork';
    forkItem.appendChild(createSvgIcon('fork'));
    const forkCount = document.createElement('span');
    forkCount.textContent = formatNumber(repo.forks_count ?? 0);
    forkItem.appendChild(forkCount);

    metrics.append(starItem, forkItem);

    // Last Updated Date
    const updated = document.createElement('span');
    updated.className = 'repo-updated';
    updated.textContent = `Updated ${formatDate(repo.updated_at)}`;

    footer.append(metrics, updated);

    // Assemble Repo Card
    card.append(topDiv, desc, footer);
    reposGrid.appendChild(card);
  });
}

/* ==========================================================================
   6. SEARCH ORCHESTRATION & STATE MANAGEMENT
   ========================================================================== */

/**
 * Sets the search loading visual state.
 * 
 * @param {boolean} isLoading - Whether a search request is actively running.
 */
function setSearchLoading(isLoading) {
  state.isSearching = isLoading;

  if (isLoading) {
    searchSubmitBtn.disabled = true;
    searchSubmitBtn.querySelector('.btn-text').classList.add('hidden');
    searchSubmitBtn.querySelector('.btn-spinner').classList.remove('hidden');

    searchLoading.classList.remove('hidden');
    searchError.classList.add('hidden');
    searchInitial.classList.add('hidden');
    searchResultContainer.classList.add('hidden');
    searchValidationMsg.classList.add('hidden');

    announceToScreenReader('Fetching developer profile and repositories...');
  } else {
    searchSubmitBtn.disabled = false;
    searchSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
    searchSubmitBtn.querySelector('.btn-spinner').classList.add('hidden');
    searchLoading.classList.add('hidden');
  }
}

/**
 * Displays an error state in the search view.
 * 
 * @param {string} title - Error title.
 * @param {string} description - Error detail message.
 */
function showSearchError(title, description) {
  searchInitial.classList.add('hidden');
  searchResultContainer.classList.add('hidden');
  searchLoading.classList.add('hidden');

  errorTitle.textContent = title;
  errorDesc.textContent = description;
  searchError.classList.remove('hidden');

  announceToScreenReader(`Error: ${title}. ${description}`);
}

/**
 * Executes a full developer profile search workflow.
 * 
 * @param {string} rawInput - Username input from form.
 */
async function handleSearch(rawInput) {
  const username = (rawInput || '').trim();

  // 1. Client-side Validation
  if (!username) {
    searchValidationMsg.textContent = 'Please enter a valid GitHub username to search.';
    searchValidationMsg.classList.remove('hidden');
    searchInput.focus();
    return;
  }

  // Clear validation & reset state
  searchValidationMsg.classList.add('hidden');
  setSearchLoading(true);

  try {
    // 2. Fetch User Profile
    const user = await fetchGitHubUser(username);
    state.lastSearchedUser = user;

    // Render Profile Card
    renderProfile(user);
    searchResultContainer.classList.remove('hidden');
    announceToScreenReader(`Profile for ${user.name || user.login} loaded successfully.`);

    // 3. Fetch User Repositories (Handled Independently)
    reposLoading.classList.remove('hidden');
    reposError.classList.add('hidden');
    reposEmpty.classList.add('hidden');

    try {
      const repos = await fetchUserRepositories(user.repos_url);
      renderRepositories(repos);
    } catch (repoErr) {
      reposGrid.innerHTML = '';
      reposError.classList.remove('hidden');
      reposErrorDesc.textContent = repoErr.message || 'Unable to fetch recent repositories. Profile details remain available.';
    } finally {
      reposLoading.classList.add('hidden');
    }

  } catch (error) {
    if (error.status === 404) {
      showSearchError('Developer not found.', 'Check the username and try again.');
    } else if (error.status === 403) {
      showSearchError('Rate limit exceeded.', error.message);
    } else {
      showSearchError('Unable to connect to GitHub.', error.message || 'Please check your internet connection and try again.');
    }
  } finally {
    setSearchLoading(false);
  }
}

/* ==========================================================================
   7. BATTLE MODE ORCHESTRATION & LOGIC
   ========================================================================== */

/**
 * Sets the Battle Mode loading state.
 * 
 * @param {boolean} isLoading - Whether battle comparison is running.
 * @param {string} [message] - Context description.
 */
function setBattleLoading(isLoading, message = 'Executing parallel requests via Promise.all()') {
  state.isBattling = isLoading;

  if (isLoading) {
    battleSubmitBtn.disabled = true;
    battleSubmitBtn.querySelector('.btn-text').classList.add('hidden');
    battleSubmitBtn.querySelector('.btn-spinner').classList.remove('hidden');

    battleLoadingDesc.textContent = message;
    battleLoading.classList.remove('hidden');
    battleError.classList.add('hidden');
    battleResultContainer.classList.add('hidden');
    battleValidationMsg.classList.add('hidden');

    announceToScreenReader('Comparing developers. Fetching profiles and repository stars...');
  } else {
    battleSubmitBtn.disabled = false;
    battleSubmitBtn.querySelector('.btn-text').classList.remove('hidden');
    battleSubmitBtn.querySelector('.btn-spinner').classList.add('hidden');
    battleLoading.classList.add('hidden');
  }
}

/**
 * Displays an error specific to Battle Mode.
 * 
 * @param {string} title - Error heading.
 * @param {string} description - Error explanation.
 */
function showBattleError(title, description) {
  battleLoading.classList.add('hidden');
  battleResultContainer.classList.add('hidden');

  battleErrorTitle.textContent = title;
  battleErrorDesc.textContent = description;
  battleError.classList.remove('hidden');

  announceToScreenReader(`Battle comparison error: ${title}. ${description}`);
}

/**
 * Renders the head-to-head battle comparison results.
 * Strictly uses Total Repository Stars (calculated via reduce) as the winner metric.
 * 
 * @param {Object} dataA - Developer A data { user, repos, totalStars, isComplete }
 * @param {Object} dataB - Developer B data { user, repos, totalStars, isComplete }
 */
function renderBattleResults(dataA, dataB) {
  battleResultContainer.innerHTML = '';

  const starsA = dataA.totalStars;
  const starsB = dataB.totalStars;

  let outcomeA = 'tie';
  let outcomeB = 'tie';

  if (starsA > starsB) {
    outcomeA = 'winner';
    outcomeB = 'runner-up';
  } else if (starsB > starsA) {
    outcomeA = 'runner-up';
    outcomeB = 'winner';
  }

  // Header Summary
  const headerCard = document.createElement('div');
  headerCard.className = 'battle-matchup-header';

  const matchupTitle = document.createElement('h2');
  matchupTitle.className = 'battle-matchup-title';

  if (outcomeA === 'winner') {
    matchupTitle.textContent = `🏆 ${dataA.user.name || dataA.user.login} takes the lead with ${formatNumber(starsA)} total stars!`;
  } else if (outcomeB === 'winner') {
    matchupTitle.textContent = `🏆 ${dataB.user.name || dataB.user.login} takes the lead with ${formatNumber(starsB)} total stars!`;
  } else {
    matchupTitle.textContent = `🤝 It's a dead tie! Both developers have exactly ${formatNumber(starsA)} total stars.`;
  }

  const matchupSub = document.createElement('p');
  matchupSub.className = 'battle-matchup-sub';
  matchupSub.textContent = 'Winner determined strictly by Total Repository Stars summed across public repositories.';
  headerCard.append(matchupTitle, matchupSub);

  // Grid for Developer A & Developer B
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'battle-cards-grid';

  function createFighterCard(data, outcome, playerLabel) {
    const card = document.createElement('article');
    card.className = `battle-fighter-card is-${outcome}`;
    card.setAttribute('aria-label', `${playerLabel}: ${data.user.login} - Result: ${outcome}`);

    // Status Badge
    const badge = document.createElement('div');
    badge.className = `fighter-badge badge-${outcome}`;
    if (outcome === 'winner') {
      badge.textContent = '🏆 WINNER';
    } else if (outcome === 'runner-up') {
      badge.textContent = 'RUNNER-UP';
    } else {
      badge.textContent = "IT'S A TIE";
    }
    card.appendChild(badge);

    // Profile Meta
    const profile = document.createElement('div');
    profile.className = 'fighter-profile';

    const avatar = document.createElement('img');
    avatar.className = 'fighter-avatar';
    avatar.src = data.user.avatar_url || '';
    avatar.alt = `${data.user.login}'s avatar`;
    avatar.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'fighter-meta';

    const name = document.createElement('h3');
    name.className = 'fighter-name';
    name.textContent = data.user.name || data.user.login;

    const login = document.createElement('span');
    login.className = 'fighter-login';
    login.textContent = `@${data.user.login}`;

    meta.append(name, login);
    profile.append(avatar, meta);

    // Core Metric: Total Repository Stars
    const metricBox = document.createElement('div');
    metricBox.className = 'fighter-metric-box';

    const metricTitle = document.createElement('span');
    metricTitle.className = 'metric-title';
    metricTitle.textContent = 'Total Repository Stars';

    const metricVal = document.createElement('span');
    metricVal.className = 'metric-stars-value';
    metricVal.appendChild(createSvgIcon('star'));
    const valText = document.createElement('span');
    valText.textContent = formatNumber(data.totalStars);
    metricVal.appendChild(valText);

    metricBox.append(metricTitle, metricVal);

    // Sub-stats (Public Repos & Followers for reference)
    const subStats = document.createElement('div');
    subStats.className = 'fighter-stats-sub';

    const repoStat = document.createElement('div');
    repoStat.className = 'fighter-substat';
    const repoLbl = document.createElement('span');
    repoLbl.className = 'fighter-substat-label';
    repoLbl.textContent = 'Public Repos';
    const repoVal = document.createElement('span');
    repoVal.className = 'fighter-substat-val';
    repoVal.textContent = formatNumber(data.user.public_repos ?? 0);
    repoStat.append(repoLbl, repoVal);

    const followerStat = document.createElement('div');
    followerStat.className = 'fighter-substat';
    const folLbl = document.createElement('span');
    folLbl.className = 'fighter-substat-label';
    folLbl.textContent = 'Followers';
    const folVal = document.createElement('span');
    folVal.className = 'fighter-substat-val';
    folVal.textContent = formatNumber(data.user.followers ?? 0);
    followerStat.append(folLbl, folVal);

    subStats.append(repoStat, followerStat);

    card.append(profile, metricBox, subStats);
    return card;
  }

  const cardA = createFighterCard(dataA, outcomeA, 'Developer A');
  const cardB = createFighterCard(dataB, outcomeB, 'Developer B');

  cardsGrid.append(cardA, cardB);

  // Methodology Explanation Card
  const methodologyCard = document.createElement('div');
  methodologyCard.className = 'battle-methodology-card';

  const methodIcon = document.createElement('div');
  methodIcon.className = 'methodology-icon';
  methodIcon.appendChild(createSvgIcon('star'));

  const methodContent = document.createElement('div');
  methodContent.className = 'methodology-content';

  const methodHeading = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Calculation Methodology: ';
  methodHeading.appendChild(strong);
  methodHeading.appendChild(document.createTextNode(
    'Both profiles were fetched in parallel via Promise.all([fetchUser(A), fetchUser(B)]). Their repositories were queried using each profile’s repos_url endpoint. Total stars were computed using: '
  ));

  const codeSnippet = document.createElement('code');
  codeSnippet.textContent = 'repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)';
  methodHeading.appendChild(codeSnippet);

  const methodNote = document.createElement('p');
  methodNote.style.marginTop = '0.5rem';
  methodNote.style.fontSize = '0.8rem';
  methodNote.style.color = 'var(--text-muted)';
  methodNote.textContent = 'Note: The outcome is strictly determined by total repository stars, not follower or repository counts.';

  methodContent.append(methodHeading, methodNote);
  methodologyCard.append(methodIcon, methodContent);

  battleResultContainer.append(headerCard, cardsGrid, methodologyCard);
  battleResultContainer.classList.remove('hidden');

  announceToScreenReader(`Battle completed: ${matchupTitle.textContent}`);
}

/**
 * Handles the Battle Mode submission flow with Promise.all() concurrency.
 */
async function handleBattleSubmit(event) {
  if (event) event.preventDefault();

  const userAName = battleUserA.value.trim();
  const userBName = battleUserB.value.trim();

  // Validate inputs
  if (!userAName || !userBName) {
    battleValidationMsg.textContent = 'Please enter GitHub usernames for both Developer A and Developer B.';
    battleValidationMsg.classList.remove('hidden');
    return;
  }

  if (userAName.toLowerCase() === userBName.toLowerCase()) {
    battleValidationMsg.textContent = 'Please enter two distinct developer usernames to compare.';
    battleValidationMsg.classList.remove('hidden');
    return;
  }

  battleValidationMsg.classList.add('hidden');
  setBattleLoading(true, 'Fetching both developer profiles simultaneously using Promise.all()...');

  try {
    // 1. Fetch both user profiles concurrently with Promise.all()
    let userA, userB;
    try {
      [userA, userB] = await Promise.all([
        fetchGitHubUser(userAName).catch(err => {
          err.failedUser = 'Developer A (' + userAName + ')';
          throw err;
        }),
        fetchGitHubUser(userBName).catch(err => {
          err.failedUser = 'Developer B (' + userBName + ')';
          throw err;
        })
      ]);
    } catch (profileErr) {
      if (profileErr.status === 404) {
        showBattleError('Developer Not Found', `${profileErr.failedUser} does not exist on GitHub. Please verify the spelling and try again.`);
      } else {
        showBattleError('Profile Request Failed', profileErr.message || 'Could not retrieve user profiles.');
      }
      return;
    }

    // 2. Fetch all repositories for both users concurrently
    battleLoadingDesc.textContent = 'Summing repository stars using Array.prototype.reduce()...';

    let reposDataA, reposDataB;
    try {
      [reposDataA, reposDataB] = await Promise.all([
        fetchAllUserRepositoriesForBattle(userA.repos_url, userA.public_repos),
        fetchAllUserRepositoriesForBattle(userB.repos_url, userB.public_repos)
      ]);
    } catch (repoErr) {
      showBattleError('Repository Request Failed', repoErr.message || 'Could not retrieve repository star counts.');
      return;
    }

    // 3. Compute total stars with reduce()
    const starsA = calculateTotalStars(reposDataA.repositories);
    const starsB = calculateTotalStars(reposDataB.repositories);

    // 4. Render comparison results
    renderBattleResults(
      { user: userA, repositories: reposDataA.repositories, totalStars: starsA, isComplete: reposDataA.isComplete },
      { user: userB, repositories: reposDataB.repositories, totalStars: starsB, isComplete: reposDataB.isComplete }
    );

  } catch (err) {
    showBattleError('Unexpected Battle Error', err.message || 'An error occurred during comparison.');
  } finally {
    setBattleLoading(false);
  }
}

/* ==========================================================================
   8. MODE SWITCHING & EVENT LISTENERS
   ========================================================================== */

/**
 * Switches the active application mode between Profile Search and Battle Mode.
 * 
 * @param {'search'|'battle'} mode - The target mode.
 */
function switchMode(mode) {
  state.currentMode = mode;

  if (mode === 'search') {
    tabSearch.classList.add('active');
    tabSearch.setAttribute('aria-selected', 'true');
    tabBattle.classList.remove('active');
    tabBattle.setAttribute('aria-selected', 'false');

    viewSearch.classList.add('active');
    viewSearch.removeAttribute('hidden');
    viewBattle.classList.remove('active');
    viewBattle.setAttribute('hidden', '');

    announceToScreenReader('Switched to Profile Search mode.');
  } else {
    tabBattle.classList.add('active');
    tabBattle.setAttribute('aria-selected', 'true');
    tabSearch.classList.remove('active');
    tabSearch.setAttribute('aria-selected', 'false');

    viewBattle.classList.add('active');
    viewBattle.removeAttribute('hidden');
    viewSearch.classList.remove('active');
    viewSearch.setAttribute('hidden', '');

    announceToScreenReader('Switched to Developer Battle Mode.');
  }
}

// Mode navigation clicks
tabSearch.addEventListener('click', () => switchMode('search'));
tabBattle.addEventListener('click', () => switchMode('battle'));

// Search form submit
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSearch(searchInput.value);
});

// Clear button logic
searchInput.addEventListener('input', () => {
  if (searchInput.value.trim().length > 0) {
    searchClearBtn.classList.remove('hidden');
  } else {
    searchClearBtn.classList.add('hidden');
  }
  searchValidationMsg.classList.add('hidden');
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.add('hidden');
  searchInput.focus();
  searchValidationMsg.classList.add('hidden');
});

// Error retry button
errorRetryBtn.addEventListener('click', () => {
  searchInput.focus();
  searchError.classList.add('hidden');
  searchInitial.classList.remove('hidden');
});

// Quick search chips
document.querySelectorAll('.chip-btn[data-username]').forEach(chip => {
  chip.addEventListener('click', () => {
    const user = chip.getAttribute('data-username');
    if (user) {
      searchInput.value = user;
      searchClearBtn.classList.remove('hidden');
      handleSearch(user);
    }
  });
});

// Battle form submit
battleForm.addEventListener('submit', handleBattleSubmit);

// Battle preset buttons
document.querySelectorAll('.battle-preset-btn').forEach(preset => {
  preset.addEventListener('click', () => {
    const userA = preset.getAttribute('data-user-a');
    const userB = preset.getAttribute('data-user-b');
    if (userA && userB) {
      battleUserA.value = userA;
      battleUserB.value = userB;
      handleBattleSubmit();
    }
  });
});
