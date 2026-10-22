// api.js — GitHub REST API service and data calculations

/**
 * Fetches user profile from GitHub REST API.
 */
async function fetchGitHubUser(username) {
  const cleanUser = encodeURIComponent(username.trim());
  const response = await fetch(`https://api.github.com/users/${cleanUser}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  if (!response.ok) {
    if (response.status === 404) {
      const err = new Error(`Developer "${username}" not found.`);
      err.status = 404;
      throw err;
    }
    if (response.status === 403) {
      const err = new Error('GitHub API rate limit exceeded (60 requests/hr). Please try again shortly.');
      err.status = 403;
      throw err;
    }
    const err = new Error(`GitHub API request failed (HTTP ${response.status})`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Fetches top 5 recently active repositories for a user.
 */
async function fetchUserRepositories(reposUrl) {
  if (!reposUrl) return [];

  const url = `${reposUrl}?sort=updated&direction=desc&per_page=100`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  if (!response.ok) {
    throw new Error(`Failed to load repositories (HTTP ${response.status})`);
  }

  const repos = await response.json();
  if (!Array.isArray(repos)) return [];

  // Deterministic client-side sorting by updated_at descending
  return repos
    .slice()
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 5);
}

/**
 * Fetches public repositories for Battle Mode to aggregate total stars.
 */
async function fetchAllUserRepositoriesForBattle(reposUrl, publicReposCount) {
  if (!reposUrl || !publicReposCount) return { repositories: [], isComplete: true };

  const perPage = 100;
  const maxPages = Math.min(Math.ceil(publicReposCount / perPage), 3); // Cap at 300 to preserve rate limits
  let allRepos = [];

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(`${reposUrl}?per_page=${perPage}&page=${page}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      if (page === 1) throw new Error(`Failed to fetch repositories (HTTP ${response.status})`);
      break;
    }

    const repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) break;
    allRepos = allRepos.concat(repos);
    if (repos.length < perPage) break;
  }

  return { repositories: allRepos, isComplete: publicReposCount <= allRepos.length };
}

/**
 * Calculates total stars using Array.prototype.reduce().
 */
function calculateTotalStars(repositories) {
  if (!Array.isArray(repositories) || repositories.length === 0) return 0;
  return repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
}
