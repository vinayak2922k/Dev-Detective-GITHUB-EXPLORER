# Dev-Detective | GitHub Profile Explorer & Battle Mode

> **“Every developer has a story. Look beyond the username. Explore profiles, discover repositories, and compare the work behind the stars.”**

Dev-Detective is a modern, responsive web application built for the **Prodesk IT Sprint 03 Assignment: “The API Hunter”**. It connects directly to the official GitHub REST API v3 to provide deep developer profile insights, showcases recent repository activity with deterministic sorting, and features an interactive head-to-head **Developer Battle Mode** powered by asynchronous parallel requests and functional data aggregation.

---

## 1. Project Overview & Sprint 03 Objective

### Sprint Objective
The primary objective of Sprint 03 is to master real-world asynchronous JavaScript development by integrating with a public REST API. Key learning goals include:
- Executing asynchronous HTTP queries using the native **Fetch API** and `async`/`await`.
- Managing complex asynchronous lifecycles with robust `try/catch/finally` control flow.
- Handling realistic network scenarios (loading spinners, 404 user not found, 403 rate limits, 5xx server errors, offline failures).
- Utilizing modern functional array methods (`.map()`, `.sort()`, `.reduce()`) to transform and aggregate external data.
- Coordinating concurrent API requests using `Promise.all()`.
- Building accessible, secure, and responsive user interfaces using vanilla HTML5, CSS3, and JavaScript without third-party frameworks.

---

## 2. Feature Breakdown

### Mandatory Core Features (Phase 1 & Phase 2)
- **Real-Time Profile Search**:
  - Direct integration with `https://api.github.com/users/{username}`.
  - Safe input validation (trims whitespace, rejects empty inputs with inline warnings, sanitizes via `encodeURIComponent`).
  - Search triggerable via Search button click or keyboard <kbd>Enter</kbd>.
  - Duplicate submission blocking and active button spinner during requests.
- **Rich Developer Profile Card**:
  - Real API fields rendered safely via `document.createElement()` and `textContent` to prevent Cross-Site Scripting (XSS).
  - Avatar display with accessible `alt` text and graceful fallback on load error.
  - Full developer name, `@login` handle, biography (with fallback for missing bios), and join date.
  - Public repository count, followers, following, and public gists.
  - Metadata badges for location, company, and portfolio/blog.
  - Portfolio URL normalization (automatically prepends `https://` if protocol is missing; displays clean "No portfolio provided" state if empty).
  - External links open in new tabs with secure `target="_blank" rel="noopener noreferrer"`.
- **Timestamp & Date Formatting**:
  - Reusable date formatting function utilizing native `Intl.DateTimeFormat` (`en-GB`).
  - Converts ISO 8601 strings (e.g., `2023-01-25T12:00:00Z`) into clean, human-readable dates (e.g., `25 Jan 2023`).
- **Comprehensive Lifecycle States**:
  - **Initial State**: Clean welcome state with helpful suggestions (`octocat`, `torvalds`, `gaearon`, `sindresorhus`).
  - **Loading State**: Immediate visual spinner and informative message with `aria-live="polite"` for screen readers.
  - **404 Not Found**: Clear "Developer not found. Check the username and try again." card with retry action.
  - **403 Rate Limit / 429**: Specific guidance regarding GitHub unauthenticated API rate limits (60 requests/hour).
  - **Network / Offline**: Graceful error handling without application crashes or exposed stack traces.
- **Latest Repositories (Phase 2)**:
  - Consumes the user's official `repos_url` endpoint (`?sort=updated&direction=desc&per_page=100`).
  - Performs deterministic client-side descending sorting by `updated_at` timestamps before slicing the top 5.
  - Displays repository name (clickable link), description, primary programming language with colored badge, star count, fork count, and last updated date.
  - Independent error handling: If repository fetching fails, profile data remains visible while a specific repository error is shown.
  - Handles accounts with zero public repositories via an empty state message.

### Advanced Features (Phase 3: Battle Mode)
- **Head-to-Head Developer Battle Mode**:
  - Accessible mode switcher between "Profile Search" and "Battle Mode".
  - Two input fields for Developer A and Developer B with quick-fill presets.
  - Concurrent data fetching using `Promise.all([fetchUser(A), fetchUser(B)])`.
  - Parallel repository gathering across both accounts using their individual `repos_url` endpoints.
  - **Total Stars Calculation**:
    - Evaluates total repository stars using `Array.prototype.reduce((total, repo) => total + (repo.stargazers_count || 0), 0)`.
    - Handles pagination safely to aggregate public repository stargazer counts.
  - **Outcome Determination**:
    - **Winner**: Highlighted with an emerald green border, subtle glow, and a `🏆 WINNER` badge.
    - **Runner-Up**: Styled with a restrained crimson border and a `RUNNER-UP` badge.
    - **Tie**: Balanced neutral styling and an `IT'S A TIE` announcement.
    - Result is strictly determined by total repository stars (not followers or repo count).
  - Granular error attribution: If one developer username is invalid, the system specifies whether Developer A or Developer B failed.

---

## 3. Technology Stack & Design Decisions

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantic Elements | High accessibility, screen-reader compatibility (`<header>`, `<main>`, `<section>`, `<article>`, `aria-live`), and SEO structure. |
| **Styling** | Vanilla CSS3 (Custom Design System) | Zero build overhead, CSS custom properties (`var(--...)`), dark developer dashboard aesthetic, flexbox/grid responsive layouts, and `prefers-reduced-motion` compliance. |
| **Logic** | Vanilla JavaScript (ES6+) | Modern asynchronous patterns (`async`/`await`, `Promise.all()`, `fetch`), functional array operators (`reduce`, `sort`, `map`), and secure DOM APIs (`createElement`, `textContent`). |
| **External API**| GitHub REST API v3 | Official unauthenticated endpoints: `/users/{username}` and `/users/{username}/repos`. |

---

## 4. Project Folder Structure

```
Sprint 3/
├── index.html        # Main HTML structure, layout, semantic tags, and ARIA attributes
├── styles.css        # Complete CSS design system, dark dashboard theme, responsive rules
├── script.js         # Core application logic, Fetch API services, DOM renderers, Battle Mode
├── README.md         # Comprehensive project documentation and evaluation guide
├── Prompts.md        # Transparent record of AI engineering prompts and iterations
├── QA-DEMO.md        # Script for the mandatory 2-minute video presentation
└── .gitignore        # Standard Git exclusion file
```

---

## 5. How to Run Locally

Because Dev-Detective is built purely with standard HTML5, CSS3, and vanilla JavaScript, it requires **no package installation, no build steps, and no backend**.

### Option A: VS Code Live Server (Recommended)
1. Open the `Sprint 3` directory in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if you have not already.
3. Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

### Option B: Python Built-In HTTP Server
Open your terminal inside the project directory and run:
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option C: Direct Browser Opening
You can double-click `index.html` to open it directly via the `file://` protocol. (Note: Running via a local HTTP server is recommended to ensure standard browser Fetch API behavior).

---

## 6. GitHub API Endpoints Used

1. **User Profile Endpoint**:
   ```http
   GET https://api.github.com/users/{username}
   Accept: application/vnd.github.v3+json
   ```
   *Fields consumed*: `avatar_url`, `name`, `login`, `bio`, `created_at`, `blog`, `html_url`, `public_repos`, `followers`, `following`, `public_gists`, `company`, `location`, `repos_url`.

2. **User Repositories Endpoint**:
   ```http
   GET {repos_url}?sort=updated&direction=desc&per_page=100
   Accept: application/vnd.github.v3+json
   ```
   *Fields consumed*: `name`, `html_url`, `description`, `language`, `stargazers_count`, `forks_count`, `updated_at`.

---

## 7. Deep-Dive: JavaScript Concepts & Explanations

### A. Fetch API and `async`/`await`
The application makes network calls using JavaScript's native `fetch()` function, combined with `async`/`await` syntax for clean asynchronous code that avoids callback hell and promise chaining confusion:

```javascript
async function fetchGitHubUser(username) {
  const cleanUsername = encodeURIComponent(username.trim());
  const endpoint = `https://api.github.com/users/${cleanUsername}`;

  const response = await fetch(endpoint, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error(`Developer "${username}" not found.`);
      error.status = 404;
      throw error;
    }
    // Handle 403, 429, 500, etc.
  }

  return await response.json();
}
```

### B. HTTP Error Handling & Lifecycle State Management
A `try/catch/finally` block wraps all user-initiated search actions:
- **`try`**: Triggers the loading state, clears stale errors, executes requests, and renders components.
- **`catch`**: Inspects `error.status` to render tailored error UI (distinguishing 404 from 403 or network errors).
- **`finally`**: Guarantees that button spinners and loading indicators are cleared regardless of success or failure.

### C. Repository Sorting & Date Formatting
While GitHub's API allows `sort=updated`, API responses can occasionally deviate or include cached timestamps. Dev-Detective guarantees ordering by performing a client-side sort on the received array:
```javascript
const sortedRepos = repos.slice().sort((a, b) => {
  const dateA = new Date(a.updated_at || 0).getTime();
  const dateB = new Date(b.updated_at || 0).getTime();
  return dateB - dateA;
});
const top5 = sortedRepos.slice(0, 5);
```

For date formatting, `Intl.DateTimeFormat` converts ISO dates into localized, human-friendly output:
```javascript
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
```

### D. `Promise.all()` and `reduce()` in Battle Mode
To benchmark two developers concurrently without sequential delays, `Promise.all()` executes profile and repository fetches in parallel:

```javascript
// Parallel profile resolution
const [userA, userB] = await Promise.all([
  fetchGitHubUser(userAName),
  fetchGitHubUser(userBName)
]);

// Parallel repository gathering
const [reposA, reposB] = await Promise.all([
  fetchRepositories(userA.repos_url),
  fetchRepositories(userB.repos_url)
]);
```

Once repository arrays are retrieved, `Array.prototype.reduce()` calculates the total repository stars:
```javascript
function calculateTotalStars(repositories) {
  if (!Array.isArray(repositories) || repositories.length === 0) return 0;
  return repositories.reduce((total, repo) => {
    const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
    return total + stars;
  }, 0);
}
```

---

## 8. API Rate Limits & Known Limitations

- **GitHub Unauthenticated Rate Limits**: GitHub limits unauthenticated REST API requests to **60 requests per hour per IP address**. When this limit is exceeded, GitHub returns HTTP 403 with `X-RateLimit-Remaining: 0`. Dev-Detective catches this status specifically and displays a friendly explanation advising the user to wait before searching again.
- **High-Repository Pagination**: GitHub limits repository results to a maximum of 100 repositories per request. To protect against depleting the unauthenticated rate limit during Battle Mode, repository fetching handles up to 3 pages (300 repositories). For developers with more than 300 repositories, stars are summed from the top 300 public repositories.

---

## 9. GitHub Pages Deployment Instructions

To deploy Dev-Detective live on **GitHub Pages**:
1. Create a new public repository on GitHub (e.g., `dev-detective`).
2. Initialize and push your local directory:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Dev-Detective GitHub Profile Explorer for Sprint 03"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. On GitHub, navigate to **Settings** > **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` and `/ (root)`.
   - Click **Save**.
5. Within 1–2 minutes, GitHub Pages will deploy your site at `https://<your-username>.github.io/<your-repo-name>/`.

---

## 10. Application Screenshots

*(Placeholder slots for your evaluation video and submission capture)*

| Profile Search & Repositories | Head-to-Head Battle Mode |
| :---: | :---: |
| ![Profile Search](screenshot-search.png) | ![Battle Mode](screenshot-battle.png) |

---

## 11. Sprint Evaluation Summary

- **Sprint**: Prodesk IT Sprint 03 — "The API Hunter"
- **Project**: Dev-Detective
- **Architecture**: Vanilla Web Stack (HTML5 / CSS3 / ES6+ JavaScript)
- **Status**: Complete, fully tested, and ready for evaluation.
