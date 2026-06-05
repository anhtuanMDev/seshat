import type {
  PagesFunction,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";

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
  nations?: Array<{ id: string; [key: string]: unknown }>;
  techniques?: Array<{ id: string; [key: string]: unknown }>;
  ingredients?: Array<{ id: string; [key: string]: unknown }>;
  monsters?: Array<{ id: string; [key: string]: unknown }>;
  treasures?: Array<{ id: string; [key: string]: unknown }>;
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
    const { token, data } = (await context.request.json()) as RequestPayload;
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } =
      context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (!token || !data || !data.books) {
      return new Response(
        JSON.stringify({
          error: "Missing authentication token or books data.",
        }),
        { status: 400 },
      ) as unknown as CloudflareResponse;
    }

    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Session expired or invalid token.",
        }),
        { status: 401 },
      ) as unknown as CloudflareResponse;
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

    // 1. Get default branch (to fallback to if user branch doesn't exist)
    const repoRes = await fetch(baseUrl, { headers });
    if (!repoRes.ok) throw new Error("Failed to access repository");
    const repoData = (await repoRes.json()) as { default_branch: string };
    const defaultBranch = repoData.default_branch;

    // 2. Try to get the user's branch
    let branchSha = "";
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, {
      headers,
    });

    if (branchRes.ok) {
      const branchData = (await branchRes.json()) as {
        object: { sha: string };
      };
      branchSha = branchData.object.sha;
    } else {
      // Create branch from default branch
      const defBranchRes = await fetch(
        `${baseUrl}/git/ref/heads/${defaultBranch}`,
        { headers },
      );
      if (!defBranchRes.ok)
        throw new Error(`Failed to get default branch ${defaultBranch}`);
      const defBranchData = (await defBranchRes.json()) as {
        object: { sha: string };
      };
      const baseSha = defBranchData.object.sha;

      const createRes = await fetch(`${baseUrl}/git/refs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
      });
      if (!createRes.ok) throw new Error("Failed to create user branch");
      branchSha = baseSha;
    }

    // 3. Build the new tree payload
    
    // Fetch existing tree recursively so we can reuse SHAs for stub chapters
    const commitRes = await fetch(`${baseUrl}/git/commits/${branchSha}`, { headers });
    const commitData = (await commitRes.json()) as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    const treeRes = await fetch(`${baseUrl}/git/trees/${baseTreeSha}?recursive=1`, { headers });
    const oldTreeData = (await treeRes.json()) as { tree: { path: string; type: string; sha: string }[] };
    const existingFiles = new Map<string, string>();
    if (oldTreeData.tree) {
      oldTreeData.tree.forEach(item => {
        if (item.type === "blob") {
          existingFiles.set(item.path, item.sha);
        }
      });
    }

    const treeFiles: {
      path: string;
      mode: "100644";
      type: "blob";
      content?: string;
      sha?: string;
    }[] = [];

    for (const book of data.books) {
      const bDir = `books/book_${book.id}`;

      // 1. book.json
      treeFiles.push({
        path: `${bDir}/book.json`,
        mode: "100644",
        type: "blob",
        content: JSON.stringify(
          {
            id: book.id,
            title: book.title,
            synopsis: book.synopsis,
            setting: book.setting,
            themes: book.themes,
            rules: book.rules,
          },
          null,
          2,
        ),
      });

      // 2. world/world.json (just the basics)
      treeFiles.push({
        path: `${bDir}/world/world.json`,
        mode: "100644",
        type: "blob",
        content: JSON.stringify({ id: book.id, title: book.title }, null, 2),
      });

      // 3. world sub-collections
      type WorldItem = { id: string; [key: string]: unknown };

      book.nations?.forEach((n: WorldItem) => {
        treeFiles.push({
          path: `${bDir}/world/nations/nation_${n.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(n, null, 2),
        });
      });
      book.monsters?.forEach((m: WorldItem) => {
        treeFiles.push({
          path: `${bDir}/world/monsters/monster_${m.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(m, null, 2),
        });
      });
      book.treasures?.forEach((t: WorldItem) => {
        treeFiles.push({
          path: `${bDir}/world/treasures/treasure_${t.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(t, null, 2),
        });
      });
      book.techniques?.forEach((t: WorldItem) => {
        treeFiles.push({
          path: `${bDir}/world/techniques/technique_${t.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(t, null, 2),
        });
      });
      book.ingredients?.forEach((i: WorldItem) => {
        treeFiles.push({
          path: `${bDir}/world/ingredients/ingredient_${i.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(i, null, 2),
        });
      });

      // 4. Core entities
      const indexCharacters: { id: string; name: string }[] = [];
      const indexEvents: { id: string; title: string }[] = [];
      const indexChapters: { id: string; title: string }[] = [];

      book.characters?.forEach((c) => {
        indexCharacters.push({ id: c.id, name: c.name });
        treeFiles.push({
          path: `${bDir}/characters/char_${c.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(c, null, 2),
        });
      });

      book.chapters?.forEach((c) => {
        indexChapters.push({ id: c.id, title: c.title });
        const filePath = `${bDir}/chapters/chapter_${c.id}.json`;

        if (c.body === undefined) {
          const oldSha = existingFiles.get(filePath);
          if (oldSha) {
            treeFiles.push({
              path: filePath,
              mode: "100644",
              type: "blob",
              sha: oldSha,
            });
            return;
          }
        }

        treeFiles.push({
          path: filePath,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(c, null, 2),
        });
      });

      book.events?.forEach((e) => {
        indexEvents.push({ id: e.id, title: e.title });
        treeFiles.push({
          path: `${bDir}/events/event_${e.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(e, null, 2),
        });
      });

      // 5. index.json for fast loading
      treeFiles.push({
        path: `${bDir}/index.json`,
        mode: "100644",
        type: "blob",
        content: JSON.stringify(
          {
            characters: indexCharacters,
            events: indexEvents,
            chapters: indexChapters,
          },
          null,
          2,
        ),
      });
    }

    // 5. Create the Tree (Omit base_tree to ensure deleted books are removed!)
    const createTreeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tree: treeFiles }),
    });
    if (!createTreeRes.ok)
      throw new Error(
        "Failed to create Git Tree: " + (await createTreeRes.text()),
      );
    const treeData = (await createTreeRes.json()) as { sha: string };

    // 6. Create the Commit
    const createCommitRes = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: `Sync from Seshat for user ${username}`,
        tree: treeData.sha,
        parents: [branchSha],
      }),
    });
    if (!createCommitRes.ok) throw new Error("Failed to create Commit");
    const newCommitData = (await createCommitRes.json()) as { sha: string };

    // 7. Update the Branch Reference
    const updateRefRes = await fetch(
      `${baseUrl}/git/refs/heads/${branchName}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: newCommitData.sha, force: true }),
      },
    );
    if (!updateRefRes.ok) throw new Error("Failed to update branch reference");

    return new Response(JSON.stringify({ success: true, branch: branchName }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as unknown as CloudflareResponse;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }) as unknown as CloudflareResponse;
  }
};
