import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { onRequestPost, type Env } from "../sync";
import type { EventContext } from "@cloudflare/workers-types";
import * as authUtils from "../authUtils";

vi.mock("../authUtils", () => ({
  verifyToken: vi.fn(),
}));

describe("sync.ts backend", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("preserves existing draft SHAs when client sends a stub chapter (c.body === undefined)", async () => {
    (authUtils.verifyToken as Mock).mockResolvedValue({ username: "testuser" });

    const reqPayload = {
      token: "fake-jwt",
      data: {
        isBookListLoaded: true,
        books: [
          {
            id: "book1",
            title: "Test Book",
            isFullyLoaded: true,
            chapters: [
              {
                id: "chap1",
                title: "Chapter 1",
                // Notice: no `body` here, meaning it's a stub chapter.
                // Also `drafts` is explicitly an empty array or undefined in the client payload, 
                // because it wasn't loaded.
              }
            ]
          }
        ]
      }
    };

    const context = {
      request: {
        json: async () => reqPayload
      },
      env: {
        GITHUB_TOKEN: "gh_token",
        GITHUB_OWNER: "owner",
        GITHUB_REPO: "repo",
        AUTH_SECRET: "secret"
      }
    } as unknown as EventContext<Env, string, Record<string, unknown>>;

    (global.fetch as Mock).mockImplementation(async (url: string, options: RequestInit | undefined) => {
      // 1. Repo default branch
      if (url.endsWith("owner/repo") && (!options || options.method === "GET" || !options.method)) {
        return { ok: true, json: async () => ({ default_branch: "main" }) };
      }
      // 2. Branch ref
      if (url.includes("/git/ref/heads/user-testuser")) {
        return { ok: true, json: async () => ({ object: { sha: "branch-sha" } }) };
      }
      // 3. Commit
      if (url.includes("/git/commits/branch-sha")) {
        return { ok: true, json: async () => ({ tree: { sha: "base-tree-sha" } }) };
      }
      // 4. Recursive Tree
      if (url.includes("/git/trees/base-tree-sha?recursive=1")) {
        return {
          ok: true,
          json: async () => ({
            tree: [
              { path: "books/book_book1/chapters/chapter_chap1/metadata.json", type: "blob", sha: "meta-sha" },
              // HERE IS THE EXISTING DRAFT:
              { path: "books/book_book1/chapters/chapter_chap1/draft-uuid-1.json", type: "blob", sha: "draft-sha-123" }
            ]
          })
        };
      }
      // 5. POST Tree
      if (url.includes("/git/trees") && options?.method === "POST") {
        return { ok: true, json: async () => ({ sha: "new-tree-sha" }), text: async () => "" };
      }
      // 6. POST Commit
      if (url.includes("/git/commits") && options?.method === "POST") {
        return { ok: true, json: async () => ({ sha: "new-commit-sha" }) };
      }
      // 7. PATCH Ref
      if (url.includes("/git/refs/heads/user-testuser") && options?.method === "PATCH") {
        return { ok: true };
      }

      throw new Error(`Unhandled fetch mock: ${options?.method || "GET"} ${url}`);
    });

    const response = await onRequestPost(context);
    expect(response.status).toBe(200);

    // Verify what tree was POSTed
    const treePostCalls = (global.fetch as Mock).mock.calls.filter(c => c[0].includes("/git/trees") && c[1]?.method === "POST");
    expect(treePostCalls.length).toBe(1);

    const treeBody = JSON.parse(treePostCalls[0][1].body);
    
    // We should see the draft file explicitly preserved using its old SHA!
    const draftFile = treeBody.tree.find((f: { path: string; sha?: string; content?: string }) => f.path === "books/book_book1/chapters/chapter_chap1/draft-uuid-1.json");
    expect(draftFile).toBeDefined();
    expect(draftFile.sha).toBe("draft-sha-123");

    // We should also verify that metadata.json includes this draft because `sync.ts` is supposed to recover it.
    const metaFile = treeBody.tree.find((f: { path: string; sha?: string; content?: string }) => f.path === "books/book_book1/chapters/chapter_chap1/metadata.json");
    expect(metaFile).toBeDefined();
    
    const metaContent = JSON.parse(metaFile.content);
    expect(metaContent.drafts).toBeDefined();
    expect(metaContent.drafts.length).toBe(1);
    expect(metaContent.drafts[0].id).toBe("draft-uuid-1");
  });
});
