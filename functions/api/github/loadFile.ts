import { verifyToken } from "./authUtils";

function guessMime(filename: string): string {
  const MIME_MAP: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    zip: "application/zip",
  };
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME_MAP[ext] || "application/octet-stream";
}

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string>;
}) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const bookId = url.searchParams.get("bookId");
  const path = url.searchParams.get("path");

  if (!token) return new Response("Unauthorized", { status: 401 });
  if (!bookId) return new Response("Missing bookId", { status: 400 });
  if (!path) return new Response("Missing path", { status: 400 });
  if (path.includes(".."))
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  const githubToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;

  try {
    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username)
      return new Response("Invalid token", { status: 401 });
    const username = payload.username as string;
    const branchName = `user-${username}`;

    const fullPath = `books/book_${bookId}/${path}`;
    const filename = path.split("/").pop() || "";
    const contentType = guessMime(filename);
    const rangeHeader = request.headers.get("Range");

    // Strategy 1 — Small files (<= 1 MB): proxy through the Contents API.
    // Streams directly without buffering in the Worker, and preserves
    // Range headers for video seeking.
    if (!rangeHeader) {
      const rawRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}?ref=${branchName}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "Seshat-App",
            Accept: "application/vnd.github.raw",
          },
        },
      );

      if (rawRes.ok) {
        const newHeaders = new Headers({
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Accept-Ranges": "bytes",
        });
        const cl = rawRes.headers.get("Content-Length");
        if (cl) newHeaders.set("Content-Length", cl);
        return new Response(rawRes.body, {
          status: rawRes.status,
          statusText: rawRes.statusText,
          headers: newHeaders,
        });
      }
    }

    // Strategy 2 — Large files (> 1 MB): redirect to raw.githubusercontent.com.
    // The browser fetches directly from GitHub's CDN — no Worker
    // CPU/memory needed.  raw.githubusercontent.com supports Range requests
    // natively, so video seeking works.
    // Authenticate with the GitHub token so private repos work.
    const rawUrl = `https://${githubToken}@raw.githubusercontent.com/${owner}/${repo}/${branchName}/${fullPath}`;

    return Response.redirect(rawUrl, 302);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
