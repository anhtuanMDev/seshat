import { verifyToken } from "./authUtils";

import { guessMime } from "./mimeMap";

/**
 * Video / audio extensions that require a streaming proxy.
 *
 * We CANNOT use a 302 redirect for these because browsers strip HTTP Basic
 * Auth credentials (token@host) from cross-origin redirect targets when
 * loading media, so the request arrives at GitHub unauthenticated.
 *
 * Instead we fetch from raw.githubusercontent.com with the Authorization
 * header inside the Worker and pipe the body straight back to the browser.
 * This is memory-efficient because we never buffer — we just pipe the stream.
 * Range requests (for seeking/scrubbing) are forwarded verbatim so the browser
 * can seek without re-downloading the whole file.
 */
const STREAM_PROXY_EXTS = new Set([
  "mp4", "webm", "mov", "avi", "mkv", "ogv",
  "mp3", "wav", "m4a", "flac", "ogg",
]);

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
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = guessMime(filename);
    const rangeHeader = request.headers.get("Range");

    // ── Strategy A: Streaming proxy for video / audio ─────────────────────
    //
    // Browsers strip Basic Auth credentials (token@host) from cross-origin
    // redirect targets for media elements, so a 302 redirect won't work.
    // We proxy the request ourselves, injecting the Authorization header,
    // and pipe the body without buffering. Range requests are forwarded so
    // seeking works natively.
    if (STREAM_PROXY_EXTS.has(ext)) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${fullPath}`;
      const fetchInit: RequestInit = {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "Seshat-App",
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        },
      };

      const upstream = await fetch(rawUrl, fetchInit);

      // Build response headers
      const resHeaders = new Headers({
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        // Allow the browser to read the response (important for media)
        "Access-Control-Allow-Origin": "*",
      });

      // Forward Content-Length and Content-Range so the browser can seek
      for (const h of ["Content-Length", "Content-Range"]) {
        const v = upstream.headers.get(h);
        if (v) resHeaders.set(h, v);
      }

      return new Response(upstream.body, {
        status: upstream.status,   // 200 or 206 (Partial Content)
        headers: resHeaders,
      });
    }

    // ── Strategy B: Proxy small files through the Contents API ────────────
    //
    // Safe for images, text, docx, PDF (< 100 MB GitHub limit).
    // Non-Range requests only; Range requests fall through to Strategy C.
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

    // ── Strategy C: Redirect for everything else ──────────────────────────
    //
    // Used for non-media files that are too large for the Contents API,
    // or when a Range request arrives for a non-media type.
    // Embedding the token in the URL works because browsers DON'T strip
    // Basic Auth on redirects for non-media resources (fetch, iframe, etc.)
    // when the URL is set explicitly.
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
