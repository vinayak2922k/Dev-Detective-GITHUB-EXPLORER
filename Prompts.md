# Prompts.md — AI Assistance Log

**Project**: Dev-Detective | GitHub Profile Explorer  
**Sprint**: Prodesk IT Sprint 03 — "The API Hunter"  
**Scope**: Frontend Logic, CSS Styling, and Minor Error Solving.

---

## 1. Frontend Logic Development

### Prompt:
> *"How do we implement GitHub REST API integration in pure vanilla JavaScript using native Fetch API, async/await, deterministic repository sorting, and Battle Mode with Promise.all() and Array.prototype.reduce()?"*

### Implementation & Outcome:
- **API Fetching (`api.js`)**: Implemented `fetchGitHubUser()` and `fetchUserRepositories()` using `async`/`await` and explicit `response.ok` checks.
- **Repository Sorting (`api.js`)**: Ensured the latest 5 repositories are ordered by performing a client-side sort:
  ```javascript
  repos.slice().sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)).slice(0, 5);
  ```
- **Battle Mode Aggregation (`api.js`)**: Coordinated concurrent profile and repository requests with `Promise.all()`, and calculated total stars across public repositories with `reduce()`:
  ```javascript
  repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
  ```
- **Modular Architecture**: Split code into `api.js` (data fetching), `ui.js` (DOM rendering & formatting), and `script.js` (event wiring) so no file exceeds ~150 lines.

---

## 2. Frontend CSS Styling

### Prompt:
> *"Design a sleek, dark developer-dashboard theme using CSS variables, subtle violet and cyan accents, clean responsive cards, and compact CSS code without unnecessary bloat."*

### Implementation & Outcome:
- **Design System (`styles.css`)**: Built custom design tokens for deep charcoal backgrounds (`#080b11`, `#0e131f`), violet/cyan accents (`#8b5cf6`, `#38bdf8`), and status states (emerald winner, crimson runner-up).
- **Responsive Layout**: Designed clean mobile and desktop layouts using CSS Grid and Flexbox.
- **Code Optimization**: Streamlined CSS rules into a compact, maintainable stylesheet under 260 lines while preserving all visual effects and accessibility styles (`:focus-visible`).

---

## 3. Error Solving & Debugging

### Prompt:
> *"Help identify and solve edge cases: handling 404 user not found, 403 API rate limits, correcting JavaScript variable syntax errors in Battle Mode, and preventing application crashes."*

### Implementation & Outcome:
- **HTTP 404 & 403 Recovery**: Added tailored error feedback for missing users and rate-limit explanations without crashing the UI.
- **Syntax Fix**: Debugged and corrected variable declarations in `handleBattleSubmit` to ensure strict ES6 validity.
- **Lifecycle Cleanup**: Used `try/catch/finally` to guarantee that button spinners and loading indicators always reset even if network requests fail.
