# Seshat API Context

This document outlines the API endpoints used by the Seshat application to synchronize data with the GitHub cloud backend. These endpoints are implemented using Cloudflare Pages Functions and are consumed by the frontend via `src/lib/githubSync.ts`.

## Base Path

All endpoints are relative to the application origin. The base path is `/api/github/`.

---

### 1. Register

**Endpoint:** `/api/github/register`
**Method:** `POST`
**Purpose:** Registers a new user into the shared database environment using a secure access code.

**Request Body (JSON):**

```typescript
{
  "username": "string",   // The user's desired username
  "email": "string",      // The user's email address
  "accessCode": "string"  // Shared access secret required to register
}
```

**Response:**

- `200 OK` on success.
- `4xx/5xx` on error (returns JSON `{ "error": "Error message" }`).

---

### 2. Login

**Endpoint:** `/api/github/login`
**Method:** `POST`
**Purpose:** Authenticates an existing user and retrieves a session token for subsequent API requests.

**Request Body (JSON):**

```typescript
{
  "username": "string",   // The registered username
  "accessCode": "string"  // The shared access secret used as a password
}
```

**Response:**

- `200 OK` with JSON:
  ```typescript
  {
    "token": "string" // Secure token to be saved in localStorage/sessionStorage
  }
  ```

---

### 3. Sync Full State (Legacy / Initialization)

**Endpoint:** `/api/github/sync`
**Method:** `POST`
**Purpose:** Syncs the entire `appStore` state blob to the GitHub repository. _Note: This is mostly for legacy support or bulk state updates, as the app is moving towards granular lazy-loading and file updates._ It is currently used primarily to instantly initialize a new book's directory structure upon creation, or to fully wipe it upon deletion.

**Request Body (JSON):**

```typescript
{
  "token": "string",  // User's auth token
  "lastKnownSha": "string", // Optimistic Concurrency Control: The last seen commit SHA. Rejects if branch has advanced.
  "data": {
    "books": BookPayload[],
    "isBookListLoaded": boolean // Guard flag: if false/undefined, backend preserves other books on GitHub instead of deleting them.
  }
}
```

**Response:**

- `200 OK` on success, returns `{ "success": true, "branch": "user-xxx", "sha": "new_commit_sha" }`.
- `409 Conflict` if the branch has advanced beyond `lastKnownSha` (returns `{ "error": "Conflict: Server has new changes...", "conflict": true }`).

---

### 4. Load All Books (Lightweight)

**Endpoint:** `/api/github/load`
**Method:** `GET`
**Purpose:** Fetches a lightweight list of all books available for the authenticated user to populate the Book List page without downloading the full chapter contents.

**Query Parameters:**

- `token`: `string` (URL Encoded) - User's auth token
- `t`: `number` - (Cache Buster) Unix timestamp (e.g., `Date.now()`) to prevent aggressive mobile caching.

**Response:**

- `200 OK` with JSON:
  ```typescript
  {
    "books": Array<BookData>, // Array of BookData objects (stripped of heavy body content)
    "branchSha": "string"     // The current commit SHA of the branch (used for OCC)
  }
  ```

---

### 5. Load Specific Book (Deep Fetch)

**Endpoint:** `/api/github/loadBook`
**Method:** `GET`
**Purpose:** Lazily fetches the data structure for a specific book when the user opens it. The backend intentionally strips out massive text fields like `chapter.body` and `chapter.notes` before sending it to the client to prevent the initial app load from crashing the browser if the book is massive.

**Query Parameters:**

- `token`: `string` (URL Encoded)
- `bookId`: `string` (URL Encoded)
- `t`: `number` - (Cache Buster) Unix timestamp to bypass mobile caching layers.

**Response:**

- `200 OK` with JSON:
  ```typescript
  {
    "book": BookData, // The partially loaded book object
    "branchSha": "string" // The current commit SHA of the branch (used for OCC)
  }
  ```

---

### 6. Update Single File (Delta Sync)

**Endpoint:** `/api/github/updateFile`
**Method:** `POST`
**Purpose:** Updates the contents of a specific file (e.g., a chapter body, event, or character profile JSON file) within a book's cloud directory. Used for granular, high-performance saving without syncing the whole universe (Delta Sync).

**CRITICAL ARCHITECTURE NOTE:** When creating the Git tree for the update, the backend MUST fetch the current commit and use its `tree.sha` as the `base_tree`. Passing the commit's own SHA as the `base_tree` will cause GitHub to silently drop all other files in the repository, leading to catastrophic data loss.

**Request Body (JSON):**

```typescript
{
  "token": "string",
  "bookId": "string",
  "path": "string",     // Relative path within the book directory (e.g., "chapters/chapter_123.json")
  "content": "string",  // The stringified JSON content to write
  "lastKnownSha": "string" // Optimistic Concurrency Control
}
```

**Response:**

- `200 OK` on success, returns `{ "success": true, "sha": "new_commit_sha" }`.
- `409 Conflict` if `lastKnownSha` does not match the current branch head.

---

### 7. Update Multiple Files (Batch Sync)

**Endpoint:** `/api/github/updateFiles`
**Method:** `POST`
**Purpose:** Updates multiple specific files simultaneously within a book's cloud directory in a single network request. Used when a page edits multiple distinct entities at once (like the World Builder page saving nations, monsters, and treasures simultaneously).

**CRITICAL ARCHITECTURE NOTE:** As with single file updates, the backend MUST use the commit's `tree.sha` as the `base_tree` when building the new tree via the GitHub API to prevent wiping the repository.

**Request Body (JSON):**

```typescript
{
  "token": "string",
  "bookId": "string",
  "files": [
    {
      "path": "string",
      "content": "string"
    }
  ],
  "lastKnownSha": "string" // Optimistic Concurrency Control
}
```

**Response:**

- `200 OK` on success, returns `{ "success": true, "sha": "new_commit_sha" }`.
- `409 Conflict` if `lastKnownSha` does not match the current branch head.

---

### 8. Load Specific File

**Endpoint:** `/api/github/loadFile`
**Method:** `GET`
**Purpose:** Lazily loads the raw contents of a specific file inside a book directory without fetching the entire book payload. Uses a GraphQL Blob query to directly fetch the plain text, bypassing the REST Contents API's 1MB file size limit and eliminating the need for base64 decoding.

**Query Parameters:**

- `token`: `string` (URL Encoded)
- `bookId`: `string` (URL Encoded)
- `path`: `string` (URL Encoded)
- `t`: `number` - (Cache Buster) Unix timestamp to ensure a fresh file fetch.

**Response:**

- `200 OK` with JSON payload representing the file contents.

---

### 9. Export Chapters (Bulk Fetch)

**Endpoint:** `/api/github/exportChapters`
**Method:** `GET`
**Purpose:** Fetches the full contents (including `body` prose) for multiple specific chapters at once using a batch GraphQL Blob query. This is used exclusively for generating Word Document exports without forcing the user to load every chapter into memory first.

**Query Parameters:**

- `token`: `string` (URL Encoded)
- `bookId`: `string` (URL Encoded)
- `chapterIds`: `string` (Comma-separated list of chapter IDs)

**Response:**

- `200 OK` with JSON:
  ```typescript
  {
    "chapters": Array<{ id: string, title: string, body: string, drafts: any[] }>
  }
  ```

---

### 10. Issue Tracker

**Endpoint:** `/api/github/issues`
**Method:** `GET` / `POST`
**Purpose:** Integrates directly with the GitHub repository's issue tracker. Allows users to submit bugs, feature requests, or discuss features directly from the app. Filters issues by the "seshat" label.

**GET Parameters:**
- `token`: `string`
- `number`: `string` (Optional, fetches a specific issue + its comments if provided. Otherwise, fetches all "seshat" issues).

**POST Request Body (JSON):**
```typescript
{
  "token": "string",
  "issueNumber"?: number, // If provided, posts a comment to the issue
  "title"?: "string",     // For new issues
  "body": "string",       // The issue/comment markdown body
  "type"?: "string"       // "bug", "recommendation", "discussion"
}
```

**Response:**
- `200 OK` (GET) or `201 Created` (POST) with issue/comment JSON payload from GitHub.

## Local-First Architecture & Conflict Resolution

Seshat employs a true "Local-First" architecture using `@legendapp/state` and `react-hook-form` connected to Cloudflare Workers. To ensure absolute data safety and offline resilience, the application guarantees the following synchronization flows:

### 1. Optimistic UI Updates (The "Anti-Doom" Patch)
All core editors (`ChapterPage.tsx`, `CharacterPage.tsx`, `EventPage.tsx`, `WorldPage.tsx`) execute **Optimistic UI Updates**. When a user hits "Save", their changes are *immediately* written to the local `appStore` (and by extension `localStorage`) **before** the GitHub API network request is dispatched. 
- If the component unmounts mid-save (user navigates away), the data is safely persisted.
- If the network request fails (e.g., a `409 Conflict`), the local changes remain active and safe on the device until they can be successfully merged or pushed.

### 2. Form State Sync (`isDirty` Protection)
To prevent background syncs from destroying active user typing sessions, all editor components subscribe to the `appStore` safely:
- If a background `Pull` overwrites the global `appStore` with new cloud data, editors will evaluate `!isDirty && !isSaving`.
- **If actively typing (Dirty)**: The editor ignores the background cloud update, preserving the user's unsaved keystrokes.
- **If reading (Clean)**: The editor automatically resets and visually updates to reflect the new cloud data.

### 3. Git-Style Conflict Resolution (Smart Merge UI)
When the user executes a `Pull` operation, Seshat no longer blindly overwrites local state. Instead:
1. `App.tsx` fetches the complete `serverBookData`.
2. The comparison engine performs a deep, granular JSON diff between `localBook` and `serverBookData` via `getConflicts`, ignoring lazy-loaded body/draft fields.
3. The conflict list is filtered to only include items relevant to the active page (active chapter, metadata, characters, events). Non-active chapter conflicts are automatically designated to auto-resolve to the server version (preserving their local bodies and drafts).
4. **Silent Auto-Merge**: If no conflicts remain for the active page (visible conflicts length is 0), the other chapters are auto-merged silently in the background using `autoMergeOtherChapters`. The local store and `lastSyncSha` are updated, and a success toast is shown without interrupting the user with a modal.
5. **Interactive Conflict Resolution**: If there are active page conflicts, the `ConflictModal` is displayed. The user resolves active conflicts using the interface (`[Keep Local]` or `[Keep Cloud]`).
6. Upon confirming the merge, the final resolved state (combining interactive resolutions and non-active chapter auto-resolutions) is saved to the store and pushed back to the cloud.

### 4. Unlimited Offline Persistence (IndexedDB)
Because massive JSON books with dozens of chapters can quickly exceed the standard 5MB `localStorage` limit (causing catastrophic `QuotaExceededError` crashes), `appStore` persistence is bound entirely to **IndexedDB**. 
- IndexedDB allows for gigabytes of offline storage, enabling the user to cache million-word novels locally without performance degradation.
- A built-in zero-downtime migration script in `appStore.ts` detects and seamlessly migrates legacy 5MB `localStorage` data into IndexedDB on startup.

### 5. Secure Data Wipe (Logout Protocol)
Because offline-first applications natively cache sensitive intellectual property into the browser's database, Seshat enforces a "Secure Logout" protocol.
- Clicking "Logout" in the UI explicitly invokes `clearAppStore()`.
- This instantly purges all in-memory React state, which structurally overwrites the persistent `IndexedDB` with a completely blank slate.
- All JWT auth tokens are simultaneously destroyed from `localStorage`/`sessionStorage`, ensuring zero trace of user data remains on shared computers.

---

## Page & Feature API Context

This section maps the Seshat application's pages and features to the APIs they consume, explaining **how** and **why** they are called in each specific context.

### 1. Auth Feature (`AuthPage.tsx`)

- **APIs Used:** `loginToGitHub`, `registerToGitHub`
- **Context & Why:** This page acts as the authentication gateway. It needs to call these POST endpoints to validate user credentials against the shared access code logic or to create a new user profile/branch on the GitHub backend. The successful response provides a JWT token, which is stored in `localStorage`/`sessionStorage` and attached to all future requests.

### 2. Book Management Feature (`BookListPage.tsx`)

- **APIs Used:** `loadFromGitHub`, `syncToGitHub`
- **Context & Why:** The dashboard where users see all their created "Worlds/Books". `loadFromGitHub` is called on mount to fetch the lightweight list of books for the user. When a user creates or deletes a book, `syncToGitHub` is fired. Because creating a book requires establishing an entirely new folder structure on GitHub, `syncToGitHub` handles the heavy initialization instantly.

### 3. Chapter Editor Feature (`ChapterPage.tsx`)

- **APIs Used:** `loadFileFromGitHub`, `updateFilesOnGitHub`
- **Context & Why:** This is the core word processor interface. Because `loadBookFromGitHub` intentionally strips the massive `body` and `notes` properties to save RAM during app initialization, `ChapterPage.tsx` must call `loadFileFromGitHub` to lazily fetch the `metadata.json` and the corresponding active `draft_{id}.json` for that exact chapter when the user clicks on it. When the user saves their prose, the app calls `updateFilesOnGitHub` to simultaneously write the delta to `chapters/chapter_{id}/metadata.json` and the currently active `draft_{id}.json`. This ensures atomic saves for both the chapter's metadata and its prose, avoiding race conditions and saving bandwidth instead of re-uploading the whole book.

### 4. Character Editor Feature (`CharacterPage.tsx`)

- **APIs Used:** `updateFileOnGitHub`
- **Context & Why:** Manages character psychological profiles, physical states, and relationships. Modifying a character profile triggers `updateFileOnGitHub` targeting `characters/char_{id}.json`. This allows for fast, isolated updates to a single character without affecting the rest of the project's state.

### 5. Event Editor Feature (`EventPage.tsx`)

- **APIs Used:** `updateFileOnGitHub`
- **Context & Why:** Manages the timeline, plotting, and character presence. Changes made to a specific event (like updating dates, locations, or consequences) trigger `updateFileOnGitHub` to overwrite `events/event_{id}.json`.

### 6. World Building Feature (`WorldPage.tsx`)

- **APIs Used:** `updateFilesOnGitHub`
- **Context & Why:** A global configuration page that aggregates Nations, Monsters, Treasures, Techniques, Ingredients, and core Rules. Hitting "Save" here means the user may have concurrently edited 5 monsters and 2 nations. Instead of making 7 separate HTTP calls (which would be slow and prone to partial failure), the page bundles all the updated file paths and serialized JSON payloads into an array and fires a single `updateFilesOnGitHub` request to commit them as a batch.

### 7. Global App Initialization (`App.tsx` / `main.tsx`)

- **APIs Used:** `loadBookFromGitHub`
- **Context & Why:** When the app mounts and a specific book is active, the app fetches the structural relational tree (characters, events, metadata) into the global `appStore` memory using `loadBookFromGitHub`. This enables the entire application to run synchronously and mostly offline.

### 8. Pure Client-Side Features (No Direct APIs)

Several pages operate entirely off the synchronized `appStore` memory without making direct API calls:

- **`ChapterListPage.tsx` & `CharacterListPage.tsx`:** Simple list views aggregating in-memory data.
- **`TimelinePage.tsx`:** Plots events chronologically using in-memory state.
- **`FightPage.tsx`:** A deterministic combat simulation engine that compares two character states directly in the browser.
- **`LoreWebPage.tsx`:** Generates a dynamic React Flow graph of relationships, computing the topology entirely client-side using `dagre`.

### 9. AI Feature (`AIPage.tsx`)

- **APIs Used:** `updateFilesOnGitHub` (via "Add to Canon"), Third-Party AI Providers (OpenAI, Anthropic, OpenRouter via direct fetch).
- **Context & Why:** A standalone workspace where the AI Oracle can be prompted for brainstorming. It implements "Smarter Context Injection," meaning the context sent to the LLM is aggressively filtered. If an entity is queried (via deep-linking URL params `focusType` and `focusId` from the rest of the application), the AI automatically maps its dependency tree (e.g. only characters they know, techniques they use, ignoring unrelated magic systems) instead of feeding the entire Book structure. The "Add to Canon" flow triggers `updateFilesOnGitHub` to seamlessly patch AI-generated text directly back into the user's defined world structure (like Character Secrets or Monster Lore) and syncs it back to GitHub.

---

## Environment Variables (Cloudflare Secrets)

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Personal access token for the GitHub repo (read/write to Git DB + Contents API) |
| `GITHUB_OWNER` | GitHub org or username owning the storage repo |
| `GITHUB_REPO` | Repository name where all book data is stored |
| `AUTH_SECRET` | Secret key for HMAC-SHA256 JWT signing/verification |

Set locally in `.dev.vars` (Wrangler reads this automatically; NOT a standard `.env` file).

---

## Auth System — JWT Detail

### Token Format
Custom HS256 JWT implemented in `functions/api/github/authUtils.ts` using the Web Crypto API (`crypto.subtle`):
- **Header**: `{ alg: "HS256", typ: "JWT" }`
- **Payload**: `{ u: username, exp: Date.now() + expiresInMs }`
- Encoded as base64url, joined as `<header>.<payload>.<signature>`

### `signToken(username, secret, expiresInMs?)`
- Default expiry: 24h; login uses 7 days
- Returns: base64url JWT string

### `verifyToken(token, secret)`
- Returns `{ username: string }` if valid and not expired
- Returns `null` on invalid signature or expiration

### AuthGuard Client-Side Decode
`src/components/AuthGuard.tsx` synchronously decodes the token payload in the browser (base64 decode only, no crypto) to check the `exp` field. If the token is missing or expired → redirect to `/auth` **without making a network request**.

### Token Storage Convention
- Key: `"seshat-auth-token"` in `localStorage` or `sessionStorage` (user's choice at login)
- Passed in the request **body** (not as `Authorization` header) for all Cloudflare Pages Functions

---

## Complete Error Code Reference

All endpoints return errors as:
```json
{ "error": "Human-readable message" }
```
Conflict (409) additionally includes `"conflict": true`.

| HTTP Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Missing required parameter(s) |
| 401 | Missing token / invalid JWT / expired JWT |
| 404 | Resource not found (branch, book, or file) |
| 409 | Sync conflict — `lastKnownSha` mismatch OR concurrent race condition caught by GitHub's atomic fast-forward check (422) |
| 500 | Server error (missing env vars, GitHub API failure, JSON parse error) |

---

## Endpoint — Register: Detailed Behaviour

| Status | Condition |
|---|---|
| 200 | `{ success: true, username: "cleaned-username" }` |
| 400 | Missing `username` or `accessCode` |
| 409 | Username already exists in `users.json` |
| 500 | Missing env vars or GitHub write failure |

Username cleaning rule: `replace(/[^a-z0-9_-]/gi, "-").toLowerCase()`

---

## Endpoint — Login: Detailed Behaviour

| Status | Condition |
|---|---|
| 200 | `{ success: true, token: "<7-day-jwt>", username: "cleaned-username" }` |
| 400 | Missing `username` or `accessCode` |
| 401 | `users.json` not found OR `accessCode` does not match stored value |
| 500 | Missing env vars |

Supports both legacy format `{ username: "code" }` and new format `{ username: { accessCode, email } }` in `users.json`.

---

## Endpoint — Sync: Git Operation Steps

1. Verify JWT → extract `username` → derive `branchName = user-<username>`
2. GET repo to find `default_branch`
3. GET `user-<username>` branch: if exists → get `branchSha`; if not → create it from `default_branch`
4. Conflict-check `lastKnownSha` vs `branchSha` → 409 if mismatch
5. GET commit at `branchSha` to get `baseTreeSha`
6. GET tree at `baseTreeSha?recursive=1` → build `existingFiles` map (path → blob sha)
7. If `data.isBookListLoaded` is false/undefined: Identify all book IDs that exist in the repository's `existingFiles` but are not in the client payload `data.books`. For all files belonging to these missing books, copy their paths and existing SHAs directly into `treeFiles` to prevent their deletion.
8. Build `treeFiles[]` for all books in the client payload:
   - Chapters with `body === undefined` (stubs): copy existing blob SHA from `existingFiles` — do NOT write content, otherwise the chapter body is wiped from GitHub
   - Chapters with content: write `metadata.json` + one `<draftId>.json` per draft
9. POST new tree with `base_tree` set to `baseTreeSha` (safely preserves unchanged data, including lazily loaded chapter bodies)
10. POST new commit with `parents: [branchSha]`
11. PATCH branch ref to new commit SHA (Does NOT use `force: true`. Relies on atomic fast-forward checks. If GitHub returns `422`, it catches race conditions and returns `409 Conflict`)
12. Return `{ success: true, branch: branchName, sha: newCommitSha }`

---

## Endpoint — updateFile / updateFiles: Git Operation Steps

Both follow identical steps, differing only in how many files go into the tree:

1. Verify JWT → derive `branchName`
2. GET branch to get `branchSha`
3. Conflict-check `lastKnownSha` → 409 if mismatch
4. GET commit at `branchSha` → extract `treeSha` from `commit.tree.sha` (**tree SHA, not commit SHA**)
5. POST new tree with `base_tree: treeSha` + the changed file(s) at `books/book_<bookId>/<path>`
6. POST commit with `parents: [branchSha]`
7. PATCH branch ref to new commit SHA (Relies on atomic fast-forward checks. If GitHub returns `422`, it converts to `409 Conflict` to catch concurrent races)
8. Return `{ success: true, sha: newCommitSha }`

> [!CAUTION]
> **CRITICAL `base_tree` rule**: Step 5 MUST use the **tree SHA** (fetched from the commit object as `.tree.sha`) as `base_tree`. If you accidentally pass the **commit SHA** as `base_tree`, GitHub silently creates a new root tree containing ONLY the changed file(s) and deletes everything else in the repository. This has caused real data loss.

---

## Endpoint — loadBook: File Path → Array Routing

File paths inside `books/book_<bookId>/` are routed to the correct `BookData` arrays by pattern matching:

| Path pattern | Destination |
|---|---|
| `book.json` | `title`, `synopsis`, `setting`, `themes`, `rules` fields |
| `/world/nations/` | `nations[]` |
| `/world/techniques/` | `techniques[]` |
| `/world/ingredients/` | `ingredients[]` |
| `/world/monsters/` | `monsters[]` |
| `/world/treasures/` | `treasures[]` |
| `/characters/` | `characters[]` |
| `/events/` | `events[]` |
| `/chapters/*/metadata.json` or `chapter_*.json` | `chapters[]` — with `body` and `drafts` fields stripped |
| `foreshadows.json` | `foreshadows[]` |

`isFullyLoaded: true` is set on the returned `BookData` object by both the API handler (`loadBook.ts`) and the client wrapper (`loadBookFromGitHub`).

---

## Client-Side Wrapper Signatures (`src/lib/githubSync.ts`)

All functions use `fetch` directly (not axios). Token is read from `localStorage`/`sessionStorage` by the calling page component and passed as a parameter.

```ts
// Full push of all books to GitHub (replaces entire branch tree)
syncToGitHub(token: string): Promise<void>
// Sends: { token, data: appStore.get(), lastKnownSha: appStore.lastSyncSha.get() }
// On success: updates appStore.lastSyncSha with returned sha

// Load lightweight book list (only book.json per book — no characters/events/chapters)
loadFromGitHub(token: string): Promise<BookData[]>
// GET /api/github/load?token=...
// On success: updates appStore.lastSyncSha from branchSha in response

// Load a single full book (all entities; chapter draft bodies still excluded)
loadBookFromGitHub(token: string, bookId: string): Promise<BookData>
// GET /api/github/loadBook?token=...&bookId=...
// Sets bookData.isFullyLoaded = true before returning
// On success: updates appStore.lastSyncSha

// Register a new user account
registerToGitHub(username: string, email: string, accessCode: string): Promise<void>
// POST /api/github/register

// Authenticate and get a JWT
loginToGitHub(username: string, accessCode: string): Promise<string>
// POST /api/github/login → returns JWT string

// Patch a single file in one Git commit (used by CharacterPage, EventPage)
updateFileOnGitHub(token: string, bookId: string, path: string, content: string): Promise<void>
// POST /api/github/updateFile
// path is relative to books/book_<bookId>/  (e.g. "characters/char_abc.json")
// Passes lastKnownSha; updates appStore.lastSyncSha on success

// Patch multiple files atomically in one Git commit (used by WorldPage, ChapterPage)
updateFilesOnGitHub(token: string, bookId: string, files: { path: string; content: string }[]): Promise<void>
// POST /api/github/updateFiles
// Passes lastKnownSha; updates appStore.lastSyncSha on success

// Lazy-load a single raw file (used by ChapterPage to fetch draft bodies)
loadFileFromGitHub(token: string, bookId: string, path: string): Promise<Record<string, unknown>>
// GET /api/github/loadFile?token=...&bookId=...&path=...
```

All wrappers re-throw errors so callers can show `showToast("...", "error")` and handle auth redirects (on 401 → clear token from storage → `navigate("/auth")`).

---

