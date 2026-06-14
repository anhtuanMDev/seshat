import { verifyToken } from "./authUtils";

export async function onRequestGet({ request, env }: { request: Request; env: Record<string, string> }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const bookId = url.searchParams.get("bookId");
  const path = url.searchParams.get("path");

  if (!token) return new Response("Unauthorized", { status: 401 });
  if (!bookId) return new Response("Missing bookId", { status: 400 });
  if (!path) return new Response("Missing path", { status: 400 });

  const githubToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "Seshat-App",
    "Content-Type": "application/json",
  };

  try {
    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username) return new Response("Invalid token", { status: 401 });
    const username = payload.username as string;
    const branchName = `user-${username}`;

    const fileRes = await fetch(`${baseUrl}/contents/books/book_${bookId}/${path}?ref=${branchName}`, { headers });
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: "File not found" }), { status: 404 });
    }
    const fileData = await fileRes.json() as { content: string; encoding: string };
    
    if (fileData.encoding === "base64") {
      const content = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ""))));
      return new Response(content, {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    } else {
      return new Response(fileData.content, {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
