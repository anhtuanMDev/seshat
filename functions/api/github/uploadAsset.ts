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

interface RequestPayload {
  token: string;
  bookId: string;
  filename: string;      // e.g. "cover.png"
  contentBase64: string; // base64-encoded file content
  mimeType: string;
  lastKnownSha?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, bookId, filename, contentBase64, mimeType, lastKnownSha } =
      (await context.request.json()) as RequestPayload;
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } =
      context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (!token || !bookId || !filename || !contentBase64) {
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

    // 1. Get the current branch
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, {
      headers,
    });
    if (!branchRes.ok) {
      throw new Error("Branch not found. Please do a full sync first.");
    }
    const branchData = (await branchRes.json()) as { object: { sha: string } };
    const branchSha = branchData.object.sha;

    if (lastKnownSha && branchSha !== lastKnownSha) {
      return new Response(
        JSON.stringify({
          error: "Conflict: Server has new changes. Please Pull before pushing.",
          conflict: true,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ) as unknown as CloudflareResponse;
    }

    // 2. Get the tree SHA from the current commit (CRITICAL: must use tree.sha not commit sha)
    const commitFetchRes = await fetch(
      `${baseUrl}/git/commits/${branchSha}`,
      { headers },
    );
    if (!commitFetchRes.ok) {
      throw new Error("Failed to fetch commit to get tree SHA");
    }
    const commitFetchData = (await commitFetchRes.json()) as {
      tree: { sha: string };
    };
    const treeSha = commitFetchData.tree.sha;

    // 3. Create a blob for the binary file (use base64 encoding)
    const blobRes = await fetch(`${baseUrl}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        content: contentBase64,
        encoding: "base64",
      }),
    });
    if (!blobRes.ok) {
      throw new Error("Failed to create blob for asset");
    }
    const blobData = (await blobRes.json()) as { sha: string };

    // 4. Create the tree with the asset file using the blob SHA
    const assetPath = `books/book_${bookId}/assets/${filename}`;
    const treeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: treeSha,
        tree: [
          {
            path: assetPath,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          },
        ],
      }),
    });
    if (!treeRes.ok) throw new Error("Failed to create tree");
    const treeData = (await treeRes.json()) as { sha: string };

    // 5. Create a commit
    const commitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `Add asset ${filename} to book ${bookId}`,
        tree: treeData.sha,
        parents: [branchSha],
      }),
    });
    if (!commitRes.ok) throw new Error("Failed to create commit");
    const commitData = (await commitRes.json()) as { sha: string };

    // 6. Update the branch reference
    const refRes = await fetch(
      `${baseUrl}/git/refs/heads/${branchName}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: commitData.sha }),
      },
    );
    if (!refRes.ok) {
      if (refRes.status === 422) {
        return new Response(
          JSON.stringify({
            error:
              "Conflict: Concurrent modification detected. Please Pull the latest changes.",
            conflict: true,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ) as unknown as CloudflareResponse;
      }
      const errTxt = await refRes.text();
      throw new Error(
        `Failed to update branch reference: ${refRes.status} ${errTxt}`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sha: commitData.sha,
        path: assetPath,
        filename,
        mimeType,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ) as unknown as CloudflareResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    ) as unknown as CloudflareResponse;
  }
};
