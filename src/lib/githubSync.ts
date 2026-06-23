import { appStore, type BookData } from "../store/appStore";

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
  try {
    const data = appStore.get();
    
    // WARNING (Code Reviewer): Race Condition Risk
    // This sync endpoint POSTs a tree with no base_tree at all (a full replacement).
    // If two tabs sync concurrently, the `lastKnownSha` check only catches the second 
    // writer after it has read its own (stale) tree. There is a window between GET tree 
    // and POST tree where a slower request could clobber a faster one's freshly-pushed changes.
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

    console.log("Successfully synced to GitHub via token!");
  } catch (error) {
    console.error("Failed to sync to GitHub:", error);
    throw error;
  }
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
    const response = await fetchApi(`/api/github/load?token=${encodeURIComponent(token)}&t=${Date.now()}`, { cache: "no-store" });
    const data = await response.json() as { books: BookData[]; branchSha?: string };
    if (data.branchSha) {
      appStore.lastSyncSha.set(data.branchSha);
    }
    return data.books;
  } catch (error) {
    console.error("Failed to load from GitHub:", error);
    throw error;
  }
};

export const loadBookFromGitHub = async (token: string, bookId: string): Promise<BookData> => {
  try {
    const response = await fetchApi(`/api/github/loadBook?token=${encodeURIComponent(token)}&bookId=${encodeURIComponent(bookId)}&t=${Date.now()}`, { cache: "no-store" });
    const data = (await response.json()) as { book?: BookData; books?: BookData[]; branchSha?: string };
    if (data.branchSha) {
      appStore.lastSyncSha.set(data.branchSha);
    }
    const bookData = data.book || (data.books && data.books[0]);
    if (!bookData) throw new Error("No book data found in response");
    bookData.isFullyLoaded = true;
    return bookData;
  } catch (error) {
    console.error("Failed to load book from GitHub:", error);
    throw error;
  }
};

export const updateFileOnGitHub = async (token: string, bookId: string, path: string, content: string): Promise<void> => {
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
  } catch (error) {
    console.error(`Failed to update ${path} on GitHub:`, error);
    throw error;
  }
};

export const updateFilesOnGitHub = async (token: string, bookId: string, files: { path: string; content: string }[]): Promise<void> => {
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
  } catch (error) {
    console.error(`Failed to update files on GitHub:`, error);
    throw error;
  }
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
