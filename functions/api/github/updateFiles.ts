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
  files: { path: string; content: string }[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, bookId, files } =
      (await context.request.json()) as RequestPayload;
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } =
      context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (
      !token ||
      !bookId ||
      !files ||
      !Array.isArray(files) ||
      files.length === 0
    ) {
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

    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, {
      headers,
    });
    if (!branchRes.ok)
      throw new Error("Branch not found. Please do a full sync first.");
    const branchData = (await branchRes.json()) as { object: { sha: string } };
    const branchSha = branchData.object.sha;

    // Get the tree SHA from the current commit
    const commitFetchRes = await fetch(`${baseUrl}/git/commits/${branchSha}`, { headers });
    if (!commitFetchRes.ok) throw new Error("Failed to fetch commit to get tree SHA");
    const commitFetchData = (await commitFetchRes.json()) as { tree: { sha: string } };
    const treeSha = commitFetchData.tree.sha;

    const treeArray = files.map((file) => ({
      path: `books/book_${bookId}/${file.path}`,
      mode: "100644",
      type: "blob",
      content: file.content,
    }));

    const treeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: treeSha,
        tree: treeArray,
      }),
    });
    if (!treeRes.ok) throw new Error("Failed to create tree");
    const treeData = (await treeRes.json()) as { sha: string };

    const commitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `Auto-save ${files.length} files`,
        tree: treeData.sha,
        parents: [branchSha],
      }),
    });
    if (!commitRes.ok) throw new Error("Failed to create commit");
    const commitData = (await commitRes.json()) as { sha: string };

    const refRes = await fetch(`${baseUrl}/git/refs/heads/${branchName}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: commitData.sha }),
    });
    if (!refRes.ok) throw new Error("Failed to update branch reference");

    return new Response(JSON.stringify({ success: true, sha: commitData.sha }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as unknown as CloudflareResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    }) as unknown as CloudflareResponse;
  }
};
