import { appStore, type BookData } from "../store/appStore";

export const syncToGitHub = async (token: string): Promise<void> => {
  try {
    const data = appStore.get();
    
    const response = await fetch("/api/github/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    console.log("Successfully synced to GitHub via token!");
  } catch (error) {
    console.error("Failed to sync to GitHub:", error);
    throw error;
  }
};

export const registerToGitHub = async (username: string, email: string, accessCode: string): Promise<void> => {
  try {
    const response = await fetch("/api/github/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, accessCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    console.log(`Successfully registered ${username} to GitHub!`);
  } catch (error) {
    console.error("Failed to register to GitHub:", error);
    throw error;
  }
};

export const loginToGitHub = async (username: string, accessCode: string): Promise<string> => {
  try {
    const response = await fetch("/api/github/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, accessCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

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
    const response = await fetch(`/api/github/load?token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json() as { books: BookData[] };
    return data.books;
  } catch (error) {
    console.error("Failed to load from GitHub:", error);
    throw error;
  }
};
