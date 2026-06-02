import { appStore } from "../store/appStore";

export const syncToGitHub = async (username: string, accessCode: string): Promise<void> => {
  try {
    const data = appStore.get();
    
    const response = await fetch("/api/github/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, accessCode, data }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    console.log(`Successfully synced to GitHub on branch ${username}!`);
  } catch (error) {
    console.error("Failed to sync to GitHub:", error);
    throw error;
  }
};

export const registerToGitHub = async (username: string, accessCode: string): Promise<void> => {
  try {
    const response = await fetch("/api/github/register", {
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

    console.log(`Successfully registered ${username} to GitHub!`);
  } catch (error) {
    console.error("Failed to register to GitHub:", error);
    throw error;
  }
};
