// ui.js — Presentation, DOM rendering, and formatting utilities

// Static trusted SVG icons
const ICONS = {
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  external: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
  location: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  company: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  fork: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9M12 12v3"/></svg>'
};

/**
 * Converts ISO date to formatted human-readable string (e.g. "25 Jan 2023").
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

/**
 * Formats numbers with comma separators.
 */
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

/**
 * Ensures portfolio URLs have valid http/https scheme.
 */
function normalizeUrl(url) {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Renders developer profile card.
 */
function renderProfile(user, mount) {
  mount.innerHTML = '';
  const card = document.createElement('article');
  card.className = 'profile-card';

  const normalizedBlog = normalizeUrl(user.blog);
  const blogLink = normalizedBlog
    ? `<a class="meta-value meta-link" href="${normalizedBlog}" target="_blank" rel="noopener noreferrer">${user.blog.trim()}</a>`
    : `<span class="meta-value meta-empty">No portfolio provided</span>`;

  card.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-wrapper">
        <img class="profile-avatar" src="${user.avatar_url}" alt="${user.name || user.login}'s avatar" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'96\\' height=\\'96\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231a2238\\'/><text x=\\'50%\\' y=\\'55%\\' fill=\\'%2338bdf8\\' font-size=\\'32\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\'>?</text></svg>'">
      </div>
      <div class="profile-names-wrapper">
        <div class="profile-name-row">
          <h2 class="profile-name">${user.name || user.login}</h2>
          <div class="profile-join-date">${ICONS.calendar} <span>Joined ${formatDate(user.created_at)}</span></div>
        </div>
        <span class="profile-username">@${user.login}</span>
        <div class="profile-actions">
          <a class="btn-github-link" href="${user.html_url}" target="_blank" rel="noopener noreferrer">
            ${ICONS.external} <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>

    <div class="profile-bio ${!user.bio ? 'bio-empty' : ''}">
      ${user.bio ? user.bio.trim() : 'This developer has not provided a biography yet.'}
    </div>

    <div class="profile-stats-grid">
      <div class="stat-item"><span class="stat-label">Repositories</span><span class="stat-value">${formatNumber(user.public_repos)}</span></div>
      <div class="stat-item"><span class="stat-label">Followers</span><span class="stat-value">${formatNumber(user.followers)}</span></div>
      <div class="stat-item"><span class="stat-label">Following</span><span class="stat-value">${formatNumber(user.following)}</span></div>
      <div class="stat-item"><span class="stat-label">Public Gists</span><span class="stat-value">${formatNumber(user.public_gists)}</span></div>
    </div>

    <div class="profile-meta-grid">
      <div class="meta-item">${ICONS.location} <span class="meta-value ${!user.location ? 'meta-empty' : ''}">${user.location || 'Not specified'}</span></div>
      <div class="meta-item">${ICONS.company} <span class="meta-value ${!user.company ? 'meta-empty' : ''}">${user.company || 'Not specified'}</span></div>
      <div class="meta-item">${ICONS.link} ${blogLink}</div>
    </div>
  `;

  mount.appendChild(card);
}

/**
 * Renders top 5 recently active repositories.
 */
function renderRepositories(repos, grid, emptyState) {
  grid.innerHTML = '';
  if (!repos || repos.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  repos.forEach(repo => {
    const card = document.createElement('article');
    card.className = 'repo-card';

    const langTag = repo.language 
      ? `<span class="repo-language-tag"><span class="language-dot"></span><span>${repo.language}</span></span>` 
      : '';

    card.innerHTML = `
      <div class="repo-card-top">
        <a class="repo-name-link" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
      </div>
      <p class="repo-description ${!repo.description ? 'desc-empty' : ''}">
        ${repo.description || 'No repository description provided.'}
      </p>
      <div class="repo-footer">
        <div class="repo-metrics">
          ${langTag}
          <span class="repo-metric-item repo-star">${ICONS.star} ${formatNumber(repo.stargazers_count)}</span>
          <span class="repo-metric-item repo-fork">${ICONS.fork} ${formatNumber(repo.forks_count)}</span>
        </div>
        <span class="repo-updated">Updated ${formatDate(repo.updated_at)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/**
 * Renders battle mode comparison results.
 */
function renderBattleResults(dataA, dataB, container) {
  container.innerHTML = '';
  const starsA = dataA.totalStars;
  const starsB = dataB.totalStars;

  const outcomeA = starsA > starsB ? 'winner' : starsB > starsA ? 'runner-up' : 'tie';
  const outcomeB = starsB > starsA ? 'winner' : starsA > starsB ? 'runner-up' : 'tie';

  const badgeMap = {
    'winner': '<span class="fighter-badge badge-winner">🏆 WINNER</span>',
    'runner-up': '<span class="fighter-badge badge-runner-up">RUNNER-UP</span>',
    'tie': '<span class="fighter-badge badge-tie">IT\'S A TIE</span>'
  };

  function fighterCard(data, outcome, role) {
    return `
      <article class="battle-fighter-card is-${outcome}">
        ${badgeMap[outcome]}
        <div class="fighter-profile">
          <img class="fighter-avatar" src="${data.user.avatar_url}" alt="${data.user.login}">
          <div class="fighter-meta">
            <h3 class="fighter-name">${data.user.name || data.user.login}</h3>
            <span class="fighter-login">@${data.user.login}</span>
          </div>
        </div>
        <div class="fighter-metric-box">
          <span class="metric-title">Total Repository Stars</span>
          <span class="metric-stars-value">${ICONS.star} ${formatNumber(data.totalStars)}</span>
        </div>
        <div class="fighter-stats-sub">
          <div class="fighter-substat"><span class="fighter-substat-label">Public Repos</span><span class="fighter-substat-val">${formatNumber(data.user.public_repos)}</span></div>
          <div class="fighter-substat"><span class="fighter-substat-label">Followers</span><span class="fighter-substat-val">${formatNumber(data.user.followers)}</span></div>
        </div>
      </article>
    `;
  }

  const title = outcomeA === 'winner' 
    ? `🏆 ${dataA.user.name || dataA.user.login} takes the lead with ${formatNumber(starsA)} total stars!`
    : outcomeB === 'winner'
    ? `🏆 ${dataB.user.name || dataB.user.login} takes the lead with ${formatNumber(starsB)} total stars!`
    : `🤝 It's a dead tie! Both developers have exactly ${formatNumber(starsA)} total stars.`;

  container.innerHTML = `
    <div class="battle-matchup-header">
      <h2 class="battle-matchup-title">${title}</h2>
      <p class="battle-matchup-sub">Winner determined strictly by Total Repository Stars summed across public repositories.</p>
    </div>
    <div class="battle-cards-grid">
      ${fighterCard(dataA, outcomeA, 'Developer A')}
      ${fighterCard(dataB, outcomeB, 'Developer B')}
    </div>
    <div class="battle-methodology-card">
      <div class="methodology-icon">${ICONS.star}</div>
      <div class="methodology-content">
        <p><strong>Calculation Methodology:</strong> Both profiles were fetched in parallel via <code>Promise.all()</code>. Total stars computed using: <code>repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)</code>.</p>
      </div>
    </div>
  `;

  container.classList.remove('hidden');
}
