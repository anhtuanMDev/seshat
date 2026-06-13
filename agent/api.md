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
**Purpose:** Syncs the entire `appStore` state blob to the GitHub repository. *Note: This is mostly for legacy support or bulk state updates, as the app is moving towards granular lazy-loading and file updates.* It is currently used primarily to instantly initialize a new book's directory structure upon creation, or to fully wipe it upon deletion.

**Request Body (JSON):**
```typescript
{
  "token": "string",  // User's auth token
  "data": "object"    // The full serializable state of the appStore
}
```

**Response:**
- `200 OK` on success.

---

### 4. Load All Books (Lightweight)
**Endpoint:** `/api/github/load`
**Method:** `GET`
**Purpose:** Fetches a lightweight list of all books available for the authenticated user to populate the Book List page without downloading the full chapter contents.

**Query Parameters:**
- `token`: `string` (URL Encoded) - User's auth token

**Response:**
- `200 OK` with JSON:
  ```typescript
  {
    "books": Array<BookData> // Array of BookData objects (stripped of heavy body content)
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

**Response:**
- `200 OK` with JSON:
  ```typescript
  {
    "book": BookData // The partially loaded book object
    // Note: Legacy implementations may wrap this in { "books": [BookData] }
  }
  ```

---

### 6. Update Single File (Delta Sync)
**Endpoint:** `/api/github/updateFile`
**Method:** `POST`
**Purpose:** Updates the contents of a specific file (e.g., a chapter body, event, or character profile JSON file) within a book's cloud directory. Used for granular, high-performance saving without syncing the whole universe (Delta Sync).

**Request Body (JSON):**
```typescript
{
  "token": "string",
  "bookId": "string",
  "path": "string",     // Relative path within the book directory (e.g., "chapters/chapter_123.json")
  "content": "string"   // The stringified JSON content to write
}
```

**Response:**
- `200 OK` on success.

---

### 7. Update Multiple Files (Batch Sync)
**Endpoint:** `/api/github/updateFiles`
**Method:** `POST`
**Purpose:** Updates multiple specific files simultaneously within a book's cloud directory in a single network request. Used when a page edits multiple distinct entities at once (like the World Builder page saving nations, monsters, and treasures simultaneously).

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
  ]
}
```

**Response:**
- `200 OK` on success.

---

### 8. Load Specific File
**Endpoint:** `/api/github/loadFile`
**Method:** `GET`
**Purpose:** Lazily loads the raw contents of a specific file inside a book directory without fetching the entire book payload.

**Query Parameters:**
- `token`: `string` (URL Encoded)
- `bookId`: `string` (URL Encoded)
- `path`: `string` (URL Encoded)

**Response:**
- `200 OK` with JSON payload representing the file contents.

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
- **APIs Used:** `loadFileFromGitHub`, `updateFileOnGitHub`
- **Context & Why:** This is the core word processor interface. Because `loadBookFromGitHub` intentionally strips the massive `body` and `notes` properties to save RAM during app initialization, `ChapterPage.tsx` must call `loadFileFromGitHub` to lazily fetch the full JSON string for that exact chapter when the user clicks on it. When the user saves their prose, the app calls `updateFileOnGitHub` to write the delta back to `chapters/chapter_{id}.json`. This ensures atomic saves, avoiding race conditions and saving bandwidth instead of re-uploading the whole book.

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
