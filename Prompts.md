# Prompts.md — AI Engineering Log & Prompt History

**Project**: Dev-Detective | GitHub Profile Explorer  
**Sprint**: Prodesk IT Sprint 03 — "The API Hunter"  
**Purpose**: Transparent documentation of prompts, architectural prompts, and refinements used while pair programming with Antigravity AI to develop the project.

---

## Prompt 1: Initial Master Prompt & Architecture Scaffolding

### Prompt Provided:
```markdown
# ANTIGRAVITY MASTER PROMPT — PRODESK IT SPRINT 03
## Project: Dev-Detective | GitHub Profile Explorer
Act as a senior frontend engineer working alongside me as a pair programmer. Build a complete, functional, responsive web application for my Prodesk IT Sprint 03 assignment, “The API Hunter.”
Tech restrictions: HTML, CSS, and vanilla JavaScript only. Use native Fetch API, async/await, Promises, try/catch, JSON parsing, array methods, and DOM manipulation. No frameworks, no build tools, runs via Live Server.
Features:
- Dark developer-dashboard aesthetic.
- Phase 1: GitHub profile search (endpoint: https://api.github.com/users/{username}), realistic fields, join date formatting, URL normalization, robust error handling (404, 403, 429, 5xx, network).
- Phase 2: Latest 5 repositories sorted by updated_at descending, using official repos_url. Independent error handling.
- Phase 3: Battle Mode comparing two developers by total repository stars calculated via reduce() across public repositories with Promise.all() concurrency.
```

### Purpose & Architectural Outcome:
- **Purpose**: Establish initial requirements, technology boundaries, project constraints, and feature scope.
- **Outcome**: Inspected the empty workspace, established the file structure (`index.html`, `styles.css`, `script.js`), designed the semantic DOM hierarchy, and created the core design system tokens in CSS.

---

## Prompt 2: Robust Asynchronous Lifecycle & Fetch API Integration

### Prompt Focus:
> *"How do we structure the `fetchGitHubUser` and `fetchUserRepositories` functions so they explicitly verify `response.ok`, handle specific HTTP status codes (especially 404 and 403 rate limits), and ensure loading states always clean up using `try/catch/finally`?"*

### Purpose & Code Outcome:
- **Purpose**: Prevent unhandled promise rejections, guarantee accurate error messaging, and avoid stuck spinners.
- **Outcome**:
  - Implemented `fetchGitHubUser()` checking `response.ok`.
  - Added specific branches for 404 (developer not found), 403 (inspecting rate limit headers/JSON), 429 (too many requests), and 500+ (server down).
  - Used `try { ... } catch (err) { ... } finally { setSearchLoading(false); }` to guarantee that user controls are unlocked on any outcome.

---

## Prompt 3: Deterministic Repository Sorting & Date Formatting

### Prompt Focus:
> *"How should we handle GitHub's repository endpoint to ensure we extract the 5 most recently active repositories, and how can we format ISO timestamps to `25 Jan 2023` across the application?"*

### Purpose & Code Outcome:
- **Purpose**: Overcome any inconsistencies in API query parameters and provide clean, readable dates.
- **Outcome**:
  - Added query parameters `?sort=updated&direction=desc&per_page=100` to the profile's `repos_url`.
  - Implemented a defensive client-side sort:
    ```javascript
    const sortedRepos = repos.slice().sort((a, b) => {
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });
    ```
  - Created a reusable `formatDate(isoString)` function using `Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })`.

---

## Prompt 4: Battle Mode Concurrency & Total Stars Aggregation

### Prompt Focus:
> *"How do we build Battle Mode so that two users are fetched simultaneously, their repositories are queried concurrently, and their total stars are safely aggregated using `Array.prototype.reduce()` while handling potential errors for individual sides?"*

### Purpose & Code Outcome:
- **Purpose**: Build a fast, fair, and resilient head-to-head comparison engine without sequential network bottlenecks.
- **Outcome**:
  - Implemented `Promise.all([fetchUser(A), fetchUser(B)])` with individual catch interceptors to identify exactly which username failed if a 404 occurs.
  - Implemented `fetchAllUserRepositoriesForBattle()` with rate-limit-conscious pagination handling.
  - Implemented `calculateTotalStars()` using `.reduce()`:
    ```javascript
    repositories.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
    ```
  - Added conditional winner, runner-up, and tie indicators and styled them with accessible status badges.

---

## Prompt 5: DOM Security, Accessibility, and Responsive Refinement

### Prompt Focus:
> *"Ensure all DOM manipulation is XSS-safe (avoiding unsanitized innerHTML for external strings), add ARIA live regions for screen reader announcements, and refine responsive breakpoints for mobile and desktop screens."*

### Purpose & Code Outcome:
- **Purpose**: Achieve enterprise-grade security and accessibility standards for the sprint evaluation.
- **Outcome**:
  - Replaced potential string interpolations with `document.createElement()`, `textContent`, and explicit attribute setters.
  - Added `aria-live="polite"` region (`#aria-status-announcer`) and role regions for errors and results.
  - Implemented focus visibility states (`:focus-visible`), media queries for reduced motion (`prefers-reduced-motion: reduce`), and responsive flex/grid layouts across desktop, tablet, and mobile widths.

---

## Prompt 6: Verification & Local Testing Suite

### Prompt Focus:
> *"Run the application locally, test with real GitHub usernames (octocat, torvalds, gaearon), test 404 non-existent users, verify Battle Mode outcomes, and inspect the browser console for zero avoidable errors."*

### Purpose & Code Outcome:
- **Purpose**: Validate all 20 mandatory test cases before final project delivery.
- **Outcome**:
  - Verified real data rendering, loading states, empty inputs, edge cases (no bio, no portfolio), and comparison logic.
  - Prepared `QA-DEMO.md` for recording the 2-minute demonstration video.
