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

### 3. Sync Full State (Legacy)
**Endpoint:** `/api/github/sync`
**Method:** `POST`
**Purpose:** Syncs the entire `appStore` state blob to the GitHub repository. *Note: This is mostly for legacy support or bulk state updates, as the app is moving towards granular lazy-loading and file updates.*

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
    "books": Array<BookData> // Array of BookData objects (often stripped of heavy body content)
  }
  ```

---

### 5. Load Specific Book (Deep Fetch)
**Endpoint:** `/api/github/loadBook`
**Method:** `GET`
**Purpose:** Lazily fetches the complete, fully-hydrated data structure for a specific book when the user opens it.

**Query Parameters:**
- `token`: `string` (URL Encoded)
- `bookId`: `string` (URL Encoded)

**Response:**
- `200 OK` with JSON:
  ```typescript
  {
    "book": BookData // The completely loaded book object
    // Note: Legacy implementations may wrap this in { "books": [BookData] }
  }
  ```

---

### 6. Update Single File
**Endpoint:** `/api/github/updateFile`
**Method:** `POST`
**Purpose:** Updates the contents of a specific file (e.g., a chapter body or JSON file) within a book's cloud directory. Used for granular, high-performance saving without syncing the whole universe.

**Request Body (JSON):**
```typescript
{
  "token": "string",
  "bookId": "string",
  "path": "string",     // Relative path within the book directory (e.g., "chapters/drafts/ch1.json")
  "content": "string"   // The text or stringified JSON content to write
}
```

**Response:**
- `200 OK` on success.

---

### 7. Update Multiple Files (Batch)
**Endpoint:** `/api/github/updateFiles`
**Method:** `POST`
**Purpose:** Updates multiple specific files simultaneously within a book's cloud directory in a single network request.

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
