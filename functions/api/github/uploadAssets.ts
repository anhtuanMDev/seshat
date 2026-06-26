import type {
  PagesFunction,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";
import { verifyToken } from "./authUtils";

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  AUTH_SECRET: string;
}

interface FilePayload {
  filename: string;
  contentBase64: string;
  mimeType: string;
}

interface RequestPayload {
  token: string;
  bookId: string;
  files: FilePayload[];
  lastKnownSha?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, bookId, files, lastKnownSha } =
      (await context.request.json()) as RequestPayload;
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } =
      context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (!token || !bookId || !files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters." }),
        { status: 400 },
      ) as unknown as CloudflareResponse;
    }

    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      }) as unknown as CloudflareResponse;
    }

    const username = payload.username;
    const branchName = `user-${username}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker",
      "Content-Type": "application/json",
    };
    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

    // 1. Get current branch
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, { headers });
    if (!branchRes.ok) throw new Error("Branch not found.");
    const branchData = (await branchRes.json()) as { object: { sha: string } };
    const branchSha = branchData.object.sha;

    if (lastKnownSha && branchSha !== lastKnownSha) {
      return new Response(
        JSON.stringify({
          error: "Conflict: Server has new changes.",
          conflict: true,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ) as unknown as CloudflareResponse;
    }

    // 2. Get tree SHA
    const commitFetchRes = await fetch(`${baseUrl}/git/commits/${branchSha}`, { headers });
    if (!commitFetchRes.ok) throw new Error("Failed to fetch commit");
    const commitFetchData = (await commitFetchRes.json()) as { tree: { sha: string } };
    const baseTreeSha = commitFetchData.tree.sha;

    // 3. Create blobs concurrently
    const treeItems = await Promise.all(files.map(async (f) => {
      const blobRes = await fetch(`${baseUrl}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: f.contentBase64,
          encoding: "base64",
        }),
      });
      if (!blobRes.ok) throw new Error(`Failed to create blob for ${f.filename}`);
      const blobData = (await blobRes.json()) as { sha: string };
      return {
        path: `books/book_${bookId}/assets/${f.filename}`,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      };
    }));

    // 4. Create the tree
    const treeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });
    if (!treeRes.ok) throw new Error("Failed to create tree");
    const treeData = (await treeRes.json()) as { sha: string };

    // 5. Create commit
    const commitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `Add ${files.length} assets to book ${bookId}`,
        tree: treeData.sha,
        parents: [branchSha],
      }),
    });
    if (!commitRes.ok) throw new Error("Failed to create commit");
    const commitData = (await commitRes.json()) as { sha: string };

    // 6. Update branch
    const refRes = await fetch(`${baseUrl}/git/refs/heads/${branchName}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: commitData.sha }),
    });
    if (!refRes.ok) {
      if (refRes.status === 422) {
        return new Response(
          JSON.stringify({ error: "Conflict", conflict: true }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ) as unknown as CloudflareResponse;
      }
      throw new Error(`Failed to update branch reference: ${refRes.status}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sha: commitData.sha,
        files: files.map(f => ({ filename: f.filename, mimeType: f.mimeType })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ) as unknown as CloudflareResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    ) as unknown as CloudflareResponse;
  }
};
