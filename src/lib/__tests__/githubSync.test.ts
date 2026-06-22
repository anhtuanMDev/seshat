import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  syncToGitHub,
  registerToGitHub,
  loginToGitHub,
  loadFromGitHub,
  loadBookFromGitHub,
  updateFileOnGitHub,
  updateFilesOnGitHub,
  loadFileFromGitHub
} from "../githubSync";

// Mock appStore to prevent real data from being read
vi.mock("../../store/appStore", () => ({
  appStore: {
    get: vi.fn(() => ({ testData: true })),
    lastSyncSha: {
      get: vi.fn(() => "mock-sha"),
      set: vi.fn()
    }
  }
}));

describe("githubSync APIs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("registerToGitHub calls fetch correctly", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    
    await registerToGitHub("testUser", "test@test.com", "code123");
    
    expect(global.fetch).toHaveBeenCalledWith("/api/github/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testUser", email: "test@test.com", accessCode: "code123" })
    });
  });

  it("loginToGitHub returns token", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "fake-jwt-token" })
    });
    
    const token = await loginToGitHub("testUser", "code123");
    expect(token).toBe("fake-jwt-token");
  });

  it("loginToGitHub throws on failure", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "Invalid code" })
    });
    
    await expect(loginToGitHub("testUser", "bad")).rejects.toThrow("Invalid code");
  });

  it("syncToGitHub calls fetch with appStore data", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    
    await syncToGitHub("token123");
    
    expect(global.fetch).toHaveBeenCalledWith("/api/github/sync", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ token: "token123", data: { testData: true }, lastKnownSha: "mock-sha" })
    }));
  });

  it("loadFromGitHub returns book list", async () => {
    const mockBooks = [{ id: "b1", title: "B1" }];
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ books: mockBooks })
    });
    
    const books = await loadFromGitHub("token123");
    expect(books).toEqual(mockBooks);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/github\/load\?token=token123&t=\d+/),
      { cache: "no-store" }
    );
  });

  it("loadBookFromGitHub returns book and sets isFullyLoaded", async () => {
    const mockBook = { id: "b1", title: "B1" };
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ book: mockBook })
    });
    
    const book = await loadBookFromGitHub("token123", "b1");
    expect(book.isFullyLoaded).toBe(true);
    expect(book.id).toBe("b1");
  });

  it("updateFileOnGitHub posts properly", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    
    await updateFileOnGitHub("token", "bookId", "path.json", '{"a":1}');
    expect(global.fetch).toHaveBeenCalledWith("/api/github/updateFile", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ token: "token", bookId: "bookId", path: "path.json", content: '{"a":1}', lastKnownSha: "mock-sha" })
    }));
  });

  it("updateFilesOnGitHub posts properly", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    
    const files = [{ path: "p1", content: "c1" }, { path: "p2", content: "c2" }];
    await updateFilesOnGitHub("token", "bookId", files);
    expect(global.fetch).toHaveBeenCalledWith("/api/github/updateFiles", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ token: "token", bookId: "bookId", files, lastKnownSha: "mock-sha" })
    }));
  });

  it("loadFileFromGitHub retrieves content", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" })
    });
    
    const data = await loadFileFromGitHub("t", "b", "p");
    expect(data).toEqual({ hello: "world" });
  });
});
