import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  AUTH_SECRET: string;
}

interface BookPayload {
  id: string;
  title: string;
  synopsis?: string;
  setting?: string;
  themes?: string;
  rules?: string;
  nations?: unknown[];
  techniques?: unknown[];
  ingredients?: unknown[];
  monsters?: unknown[];
  treasures?: unknown[];
  characters?: Array<{ id: string; name: string; [key: string]: unknown }>;
  chapters?: Array<{ id: string; title: string; [key: string]: unknown }>;
  events?: Array<{ id: string; title: string; [key: string]: unknown }>;
}

interface RequestPayload {
  token?: string;
  data?: {
    books?: BookPayload[];
  };
}

import { verifyToken } from "./authUtils";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, data } = await context.request.json() as RequestPayload;
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } = context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(JSON.stringify({ error: "Missing environment variables." }), { status: 500 }) as unknown as CloudflareResponse;
    }
    if (!token || !data || !data.books) {
      return new Response(JSON.stringify({ error: "Missing authentication token or books data." }), { status: 400 }) as unknown as CloudflareResponse;
    }

    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized. Session expired or invalid token." }), { status: 401 }) as unknown as CloudflareResponse;
    }

    const username = payload.username;
    const branchName = `user-${username}`;
    const headers = {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker"
    };
    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

    // 1. Get default branch (to fallback to if user branch doesn't exist)
    const repoRes = await fetch(baseUrl, { headers });
    if (!repoRes.ok) throw new Error("Failed to access repository");
    const repoData = await repoRes.json() as { default_branch: string };
    const defaultBranch = repoData.default_branch;

    // 2. Try to get the user's branch
    let branchSha = "";
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, { headers });
    
    if (branchRes.ok) {
      const branchData = await branchRes.json() as { object: { sha: string } };
      branchSha = branchData.object.sha;
    } else {
      // Create branch from default branch
      const defBranchRes = await fetch(`${baseUrl}/git/ref/heads/${defaultBranch}`, { headers });
      if (!defBranchRes.ok) throw new Error(`Failed to get default branch ${defaultBranch}`);
      const defBranchData = await defBranchRes.json() as { object: { sha: string } };
      const baseSha = defBranchData.object.sha;

      const createRes = await fetch(`${baseUrl}/git/refs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha })
      });
      if (!createRes.ok) throw new Error("Failed to create user branch");
      branchSha = baseSha;
    }

    // 3. Get the commit to find the base tree
    const commitRes = await fetch(`${baseUrl}/git/commits/${branchSha}`, { headers });
    if (!commitRes.ok) throw new Error("Failed to fetch latest commit");
    const commitData = await commitRes.json() as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    // 4. Build the new tree payload
    const treeFiles: { path: string; mode: "100644"; type: "blob"; content: string }[] = [];
    
    for (const book of data.books) {
      const bTitle = book.title.replace(/[^a-z0-9_-]/gi, '_') || book.id;
      
      const worldData = {
        title: book.title, synopsis: book.synopsis, setting: book.setting,
        themes: book.themes, rules: book.rules, nations: book.nations,
        techniques: book.techniques, ingredients: book.ingredients,
        monsters: book.monsters, treasures: book.treasures,
      };
      treeFiles.push({
        path: `${bTitle}/world.json`, mode: "100644", type: "blob",
        content: JSON.stringify(worldData, null, 2)
      });

      book.characters?.forEach((c) => {
        const cName = c.name.replace(/[^a-z0-9_-]/gi, '_') || c.id;
        treeFiles.push({ path: `${bTitle}/characters/${cName}_${c.id.slice(0,4)}.json`, mode: "100644", type: "blob", content: JSON.stringify(c, null, 2) });
      });

      book.chapters?.forEach((c) => {
        const cTitle = c.title.replace(/[^a-z0-9_-]/gi, '_') || c.id;
        treeFiles.push({ path: `${bTitle}/chapters/${cTitle}_${c.id.slice(0,4)}.json`, mode: "100644", type: "blob", content: JSON.stringify(c, null, 2) });
      });

      book.events?.forEach((e) => {
        const eTitle = e.title.replace(/[^a-z0-9_-]/gi, '_') || e.id;
        treeFiles.push({ path: `${bTitle}/events/${eTitle}_${e.id.slice(0,4)}.json`, mode: "100644", type: "blob", content: JSON.stringify(e, null, 2) });
      });
    }

    // 5. Create the Tree
    const createTreeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeFiles })
    });
    if (!createTreeRes.ok) throw new Error("Failed to create Git Tree: " + await createTreeRes.text());
    const treeData = await createTreeRes.json() as { sha: string };

    // 6. Create the Commit
    const createCommitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `Sync from Seshat for user ${username}`,
        tree: treeData.sha,
        parents: [branchSha]
      })
    });
    if (!createCommitRes.ok) throw new Error("Failed to create Commit");
    const newCommitData = await createCommitRes.json() as { sha: string };

    // 7. Update the Branch Reference
    const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branchName}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha, force: true })
    });
    if (!updateRefRes.ok) throw new Error("Failed to update branch reference");

    return new Response(JSON.stringify({ success: true, branch: branchName }), {
      status: 200, headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;
  }
};
