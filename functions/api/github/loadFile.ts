import { verifyToken } from "./authUtils";

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

function guessMime(filename: string): string {
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
  const authHeaders = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "Seshat-App",
  };

  try {
    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username)
      return new Response("Invalid token", { status: 401 });
    const username = payload.username as string;
    const branchName = `user-${username}`;

    const fullPath = `books/book_${bookId}/${path}`;

    // Use the raw content API: Accept: application/vnd.github.raw returns
    // the file bytes directly instead of base64-encoded JSON.
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}?ref=${branchName}`,
      {
        headers: {
          ...authHeaders,
          Accept: "application/vnd.github.raw",
        },
      },
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to load file" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bytes = await response.arrayBuffer();
    const filename = path.split("/").pop() || "";
    const contentType = guessMime(filename);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
