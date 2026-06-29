import { appStore, type BookData } from "../store/appStore";

export interface AssetEntry {
  filename: string;
  path: string;
  sha: string;
  size: number;
  mimeType: string;
}

async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 401) {
      // Could dispatch a logout event here if needed
      const errorData = await response.json().catch(() => ({ error: "Unauthorized" }));
      throw new Error(errorData.error || "Authentication expired. Please log in again.");
    }
    if (response.status === 409) {
      throw new Error("Git conflict: The remote repository contains changes that conflict with your local edits. Please Pull the latest changes first to merge.");
    }
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response;
}

export const syncToGitHub = async (token: string): Promise<void> => {
  return navigator.locks.request("seshat-sync", async () => {
    try {
      const data = appStore.get();
      
      const response = await fetchApi("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, data, lastKnownSha: appStore.lastSyncSha.get() }),
      });

      const resData = await response.json().catch(() => ({})) as { sha?: string };
      if (resData.sha) {
        appStore.lastSyncSha.set(resData.sha);
      }
      appStore.lastSyncedCloud.set(Date.now());

      console.log("Successfully synced to GitHub via token!");
    } catch (error) {
      console.error("Failed to sync to GitHub:", error);
      throw error;
    }
  });
};

export const registerToGitHub = async (username: string, email: string, accessCode: string): Promise<void> => {
  try {
    await fetchApi("/api/github/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, accessCode }),
    });

    console.log(`Successfully registered ${username} to GitHub!`);
  } catch (error) {
    console.error("Failed to register to GitHub:", error);
    throw error;
  }
};

export const loginToGitHub = async (username: string, accessCode: string): Promise<string> => {
  try {
    const response = await fetchApi("/api/github/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, accessCode }),
    });

    const resData = await response.json() as { token: string };
    console.log(`Successfully logged in ${username}!`);
    return resData.token;
  } catch (error) {
    console.error("Failed to login:", error);
    throw error;
  }
};

export const loadFromGitHub = async (token: string): Promise<BookData[]> => {
  try {
    appStore.isSyncingRemote.set(true);
    const response = await fetchApi(`/api/github/load?token=${encodeURIComponent(token)}&t=${Date.now()}`, { cache: "no-store" });
    const data = await response.json() as { books: BookData[]; branchSha?: string };
    if (data.branchSha) {
      // Only advance the global SHA if we don't have any fully loaded books that might be holding stale deep data.
      // If we blindly advance it here, a subsequent sync will bypass OCC and overwrite the cloud with stale local data.
      const books = appStore.books.get() || [];
      const hasFullyLoaded = books.some(b => b.isFullyLoaded);
      if (!hasFullyLoaded) {
        appStore.lastSyncSha.set(data.branchSha);
      }
    }
    appStore.lastSyncedCloud.set(Date.now());
    return data.books;
  } catch (error) {
    console.error("Failed to load from GitHub:", error);
    throw error;
  } finally {
    appStore.isSyncingRemote.set(false);
  }
};

export const loadBookFromGitHub = async (token: string, bookId: string): Promise<BookData> => {
  try {
    appStore.isSyncingRemote.set(true);
    const response = await fetchApi(`/api/github/loadBook?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&t=${Date.now()}`, { cache: "no-store" });
    const data = (await response.json()) as { book?: BookData; books?: BookData[]; branchSha?: string };
    const bookData = data.book || (data.books && data.books[0]);
    if (!bookData) throw new Error("No book data found in response");
    bookData.isFullyLoaded = true;
    if (data.branchSha) {
      (bookData as BookData & { _branchSha?: string })._branchSha = data.branchSha;
    }
    appStore.lastSyncedCloud.set(Date.now());
    return bookData;
  } catch (error) {
    console.error("Failed to load book from GitHub:", error);
    throw error;
  } finally {
    appStore.isSyncingRemote.set(false);
  }
};

export const updateFileOnGitHub = async (token: string, bookId: string, path: string, content: string): Promise<void> => {
  return navigator.locks.request("seshat-sync", async () => {
    try {
      const response = await fetchApi("/api/github/updateFile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, bookId, path, content, lastKnownSha: appStore.lastSyncSha.get() }),
      });

      const resData = await response.json().catch(() => ({})) as { sha?: string };
      if (resData.sha) {
        appStore.lastSyncSha.set(resData.sha);
      }
      appStore.lastSyncedCloud.set(Date.now());
    } catch (error) {
      console.error(`Failed to update ${path} on GitHub:`, error);
      throw error;
    }
  });
};

export const updateFilesOnGitHub = async (token: string, bookId: string, files: { path: string; content: string }[]): Promise<void> => {
  return navigator.locks.request("seshat-sync", async () => {
    try {
      const response = await fetchApi("/api/github/updateFiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, bookId, files, lastKnownSha: appStore.lastSyncSha.get() }),
      });

      const resData = await response.json().catch(() => ({})) as { sha?: string };
      if (resData.sha) {
        appStore.lastSyncSha.set(resData.sha);
      }
      appStore.lastSyncedCloud.set(Date.now());
    } catch (error) {
      console.error(`Failed to update files on GitHub:`, error);
      throw error;
    }
  });
};

export const loadChaptersForExport = async (
  token: string, bookId: string, chapterIds: string[],
): Promise<Record<string, unknown>[]> => {
  try {
    const response = await fetchApi(
      `/api/github/exportChapters?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&chapterIds=${encodeURIComponent(chapterIds.join(","))}&t=${Date.now()}`,
      { cache: "no-store" },
    );
    const data = await response.json() as { chapters: Record<string, unknown>[] };
    return data.chapters || [];
  } catch (error) {
    console.error("Failed to load chapters for export:", error);
    throw error;
  }
};

export const loadFileFromGitHub = async (token: string, bookId: string, path: string): Promise<Record<string, unknown>> => {
  try {
    const response = await fetchApi(`/api/github/loadFile?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&path=${encodeURIComponent(path)}&t=${Date.now()}`, { cache: "no-store" });
    return await response.json();
  } catch (error) {
    console.error(`Failed to load file ${path} from GitHub:`, error);
    throw error;
  }
};

/**
 * Upload a binary asset file to the book's assets/ folder on GitHub.
 * The file is base64-encoded in the browser and committed via the Git blobs API.
 */
export const uploadAssetToGitHub = async (
  token: string,
  bookId: string,
  file: File,
): Promise<{ sha: string; path: string; filename: string }> => {
  return navigator.locks.request("seshat-sync", async () => {
    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const contentBase64 = btoa(binary);

    const response = await fetchApi("/api/github/uploadAsset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        bookId,
        filename: file.name,
        contentBase64,
        mimeType: file.type || "application/octet-stream",
        lastKnownSha: appStore.lastSyncSha.get(),
      }),
    });

    const resData = (await response.json()) as {
      sha: string;
      path: string;
      filename: string;
    };
    if (resData.sha) {
      appStore.lastSyncSha.set(resData.sha);
    }
    appStore.lastSyncedCloud.set(Date.now());
    return resData;
  });
};

/**
 * Upload multiple binary asset files concurrently to the book's assets/ folder on GitHub.
 */
export const uploadAssetsToGitHub = async (
  token: string,
  bookId: string,
  files: File[],
): Promise<{ sha: string; files: { filename: string; mimeType: string }[] }> => {
  return navigator.locks.request("seshat-sync", async () => {
    const payloads = await Promise.all(files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return {
        filename: file.name,
        contentBase64: btoa(binary),
        mimeType: file.type || "application/octet-stream",
      };
    }));

    const response = await fetchApi("/api/github/uploadAssets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        bookId,
        files: payloads,
        lastKnownSha: appStore.lastSyncSha.get(),
      }),
    });

    const resData = (await response.json()) as {
      sha: string;
      files: { filename: string; mimeType: string }[];
    };
    if (resData.sha) {
      appStore.lastSyncSha.set(resData.sha);
    }
    appStore.lastSyncedCloud.set(Date.now());
    return resData;
  });
};

/**
 * List all assets stored in the book's assets/ folder on GitHub.
 */
export const listAssetsFromGitHub = async (
  token: string,
  bookId: string,
): Promise<AssetEntry[]> => {
  try {
    const response = await fetchApi(
      `/api/github/listAssets?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&t=${Date.now()}`,
      { cache: "no-store" },
    );
    const data = (await response.json()) as {
      assets: AssetEntry[];
      branchSha?: string;
    };
    if (data.branchSha) {
      appStore.lastSyncSha.set(data.branchSha);
    }
    return data.assets || [];
  } catch (error) {
    console.error("Failed to list assets from GitHub:", error);
    throw error;
  }
};

/**
 * Build a raw GitHub content URL for a given asset path.
 * Uses the authenticated raw URL via the Contents API.
 */
export const buildAssetRawUrl = (
  bookId: string,
  filename: string,
  username: string,
  githubOwner: string,
  githubRepo: string,
): string => {
  const branch = `user-${username}`;
  return `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${branch}/books/book_${bookId}/assets/${encodeURIComponent(filename)}`;
};
