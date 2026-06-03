import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";
import { verifyToken } from "./authUtils";
import type { Env } from "./sync";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get("token");
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } = context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(JSON.stringify({ error: "Missing environment variables." }), { status: 500 }) as unknown as CloudflareResponse;
    }
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authentication token." }), { status: 400 }) as unknown as CloudflareResponse;
    }

    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 }) as unknown as CloudflareResponse;
    }

    const username = payload.username;
    const branchName = `user-${username}`;
    const headers = {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker",
    };
    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

    // 1. Get branch commit
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, { headers });
    if (!branchRes.ok) {
      // If branch doesn't exist, user has no books yet
      return new Response(JSON.stringify({ books: [] }), {
        status: 200, headers: { "Content-Type": "application/json" }
      }) as unknown as CloudflareResponse;
    }
    const branchData = await branchRes.json() as { object: { sha: string } };

    // 2. Get the tree recursively
    const treeRes = await fetch(`${baseUrl}/git/trees/${branchData.object.sha}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error("Failed to fetch repository tree.");
    const treeData = await treeRes.json() as { tree: { path: string; sha: string; type: string }[] };

    // 3. Reconstruct books
    // To save bandwidth and time, we ONLY download the basic book metadata (book.json) for the list view.
    // The individual book details will be loaded on demand.
    const blobs = treeData.tree.filter(f => f.type === "blob" && f.path.startsWith("books/") && f.path.endsWith("/book.json"));
    // Cloudflare Workers can fetch up to 50 concurrent requests easily, let's do it in chunks of 10 to be safe.
    const fileContents: Record<string, string> = {};
    for (let i = 0; i < blobs.length; i += 10) {
      const chunk = blobs.slice(i, i + 10);
      const promises = chunk.map(async (blob) => {
        const blobRes = await fetch(`${baseUrl}/git/blobs/${blob.sha}`, { headers });
        if (blobRes.ok) {
          const blobData = await blobRes.json() as { content: string; encoding: string };
          if (blobData.encoding === "base64") {
             // atob is available in workers
             fileContents[blob.path] = decodeURIComponent(escape(atob(blobData.content.replace(/\n/g, ""))));
          } else {
             fileContents[blob.path] = blobData.content;
          }
        }
      });
      await Promise.all(promises);
    }

    // Now re-assemble into BookData[]
    const booksMap: Record<string, Record<string, unknown>> = {};
    
    for (const [path, content] of Object.entries(fileContents)) {
      if (!path.startsWith("books/book_")) continue;
      
      const parts = path.split("/");
      const bookDir = parts[1]; // book_abc123
      const bookId = bookDir.replace("book_", "");
      
      if (!booksMap[bookId]) {
        booksMap[bookId] = {
          id: bookId, title: "Unknown"
        };
      }
      
      const book = booksMap[bookId];
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(content) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (path.endsWith("book.json")) {
        book.title = data.title;
      }
    }

    return new Response(JSON.stringify({ books: Object.values(booksMap) }), {
      status: 200, headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;
  }
};
