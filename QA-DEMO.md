# QA-DEMO.md — 2-Minute Video Presentation Script

**Project**: Dev-Detective | GitHub Profile Explorer & Battle Mode  
**Assignment**: Prodesk IT Sprint 03 — "The API Hunter"  
**Total Target Duration**: Exactly 2 minutes (120 seconds)

---

## Video Timeline & Presentation Script

### 0:00 – 0:15 | Introduction & Product Vision (15s)
- **On Screen**: Dev-Detective homepage loaded on the browser at `http://127.0.0.1:5500`. The clean, dark developer-dashboard theme is visible with the initial welcome state.
- **Presenter Script**:
  > *"Hello everyone! This is Dev-Detective, my submission for Prodesk IT Sprint 03, 'The API Hunter'. Dev-Detective is a web application built using 100% vanilla JavaScript, semantic HTML5, and modern CSS3. It is designed to explore GitHub developer profiles and compare their impact through head-to-head repository statistics—with zero frameworks and zero dependencies."*

---

### 0:15 – 0:35 | Profile Search & Loading State (20s)
- **On Screen**: Type `octocat` into the search bar and click **Search** (or press Enter).
- **Key Visuals to Show**:
  - The loading spinner appearing inside the button and in the status area (`aria-live="polite"`).
  - The real GitHub profile card loading with:
    - Octocat's avatar, name, and `@octocat` handle.
    - Formatted join date: `Joined 25 Jan 2011`.
    - Real repository, follower, following, and gist counts.
    - Clickable portfolio URL normalized with HTTPS and company/location metadata.
- **Presenter Script**:
  > *"First, let's test our core Profile Search with 'octocat'. Notice the instant loading state querying the official GitHub API. Once resolved, the profile card displays real data: avatar, join date formatted using native Intl.DateTimeFormat, key statistics, and normalized external links that open safely in a new tab."*

---

### 0:35 – 0:55 | Latest Repositories & Date Sorting (20s)
- **On Screen**: Scroll smoothly down to the **"Latest repositories"** section.
- **Key Visuals to Show**:
  - Exactly 5 repository cards displayed.
  - Hover over a repository name link.
  - Point to the primary language badge (e.g. Ruby, HTML), star count (⭐), fork count (🍴), and the formatted `Updated 05 Feb 2024` timestamp.
- **Presenter Script**:
  > *"Below the profile, Dev-Detective uses the user's official `repos_url` endpoint to fetch public repositories. We perform a deterministic client-side sort on the `updated_at` timestamps to ensure we always highlight the top five most recently active projects with their language, stars, and forks."*

---

### 0:55 – 1:15 | 404 Error & Validation Handling (20s)
- **On Screen**:
  1. Clear the search input and hit **Search** -> Show inline validation: *"Please enter a valid GitHub username to search."*
  2. Type a deliberately non-existent username like `nonexistent-user-xyz-987456` and click Search.
- **Key Visuals to Show**:
  - The clean error state card appears: *"Developer not found. Check the username and try again."*
  - The page does not crash, and the search input remains immediately ready for another search.
- **Presenter Script**:
  > *"Robust error handling is essential. If I submit an empty input, an inline validation alert stops unnecessary API calls. If I search for a non-existent user, our fetch logic intercepts the HTTP 404 status, catching the error and displaying a friendly recovery state without crashing the app."*

---

### 1:15 – 1:45 | Developer Battle Mode & `Promise.all()` (30s)
- **On Screen**: Click the **Battle Mode** navigation tab at the top.
- **Key Visuals to Show**:
  - Transition into the Battle Mode view.
  - Click the preset button **"Dan Abramov vs Evan You"** (or type `gaearon` and `yyx990803`).
  - Click **Compare Developers**.
  - Show the loading state: *"Executing parallel requests via Promise.all()..."*
  - Show the side-by-side comparison cards:
    - **Winner card** in emerald green with `🏆 WINNER` badge and total stars.
    - **Runner-up card** with `RUNNER-UP` badge.
    - Point out the calculation explanation card showing `reduce()` summing `stargazers_count`.
- **Presenter Script**:
  > *"Now for Phase 3: Battle Mode! We can pit two developers head-to-head. When I click Compare, we fire two concurrent requests using `Promise.all()`, fetch both developers' repositories, and sum their total stars using `Array.prototype.reduce()`. As we can see, the winner is determined strictly by total repository stars with an emerald badge and full calculation transparency."*

---

### 1:45 – 2:00 | Architecture & Wrap-Up (15s)
- **On Screen**: Switch back to Profile Search, resize browser window to show mobile responsiveness, and conclude.
- **Presenter Script**:
  > *"Everything you see is powered by vanilla JavaScript ES6+, clean async/await patterns, semantic HTML, and responsive CSS. Thank you for watching, and Dev-Detective is fully ready for review!"*

---

## Contingency / Fallback Tips
- If GitHub API unauthenticated rate limits (60 req/hr) are reached during recording, Dev-Detective's 403 screen will cleanly inform the viewer of the rate limit. Simply wait or record when the hourly quota refreshes.
- Ensure browser dev tools console is closed or clean so viewers can see zero errors during the demonstration.
