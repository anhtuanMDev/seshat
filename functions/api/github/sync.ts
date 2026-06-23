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
  isFullyLoaded?: boolean;
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
  foreshadows?: Array<{ id: string; [key: string]: unknown }>;
}

interface RequestPayload {
  token?: string;
  lastKnownSha?: string;
  data?: {
    books?: BookPayload[];
    isBookListLoaded?: boolean;
  };
}

import { verifyToken } from "./authUtils";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { token, data, lastKnownSha } = (await context.request.json()) as RequestPayload;
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

      if (lastKnownSha && branchSha !== lastKnownSha) {
        return new Response(
          JSON.stringify({
            error: "Conflict: Server has new changes. Please Pull before pushing.",
            conflict: true,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ) as unknown as CloudflareResponse;
      }
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
      sha?: string | null;
    }[] = [];

    const unseenFiles = new Set(existingFiles.keys());
    const clientBookIds = new Set(data.books.map(b => b.id));
    const isBookListLoaded = !!data.isBookListLoaded;

    if (!isBookListLoaded) {
      for (const filePath of unseenFiles) {
        const match = filePath.match(/^books\/book_([^/]+)\//);
        if (match && !clientBookIds.has(match[1])) {
          unseenFiles.delete(filePath);
        }
      }
    }

    for (const book of data.books) {
      const bDir = `books/book_${book.id}`;
      
      if (book.isFullyLoaded === false) {
        for (const filePath of unseenFiles) {
          if (filePath.startsWith(`${bDir}/`)) {
            unseenFiles.delete(filePath);
          }
        }
        continue;
      }

      const addFile = (fileDef: { path: string; mode: "100644"; type: "blob"; content?: string; sha?: string }) => {
        treeFiles.push(fileDef);
        unseenFiles.delete(fileDef.path);
      };

      // 1. book.json
      addFile({
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

      // 2. world/world.json
      addFile({
        path: `${bDir}/world/world.json`,
        mode: "100644",
        type: "blob",
        content: JSON.stringify({ id: book.id, title: book.title }, null, 2),
      });

      // 3. world sub-collections
      type WorldItem = { id: string; [key: string]: unknown };

      book.nations?.forEach((n: WorldItem) => {
        addFile({
          path: `${bDir}/world/nations/nation_${n.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(n, null, 2),
        });
      });
      book.monsters?.forEach((m: WorldItem) => {
        addFile({
          path: `${bDir}/world/monsters/monster_${m.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(m, null, 2),
        });
      });
      book.treasures?.forEach((t: WorldItem) => {
        addFile({
          path: `${bDir}/world/treasures/treasure_${t.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(t, null, 2),
        });
      });
      book.techniques?.forEach((t: WorldItem) => {
        addFile({
          path: `${bDir}/world/techniques/technique_${t.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(t, null, 2),
        });
      });
      book.ingredients?.forEach((i: WorldItem) => {
        addFile({
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
        addFile({
          path: `${bDir}/characters/char_${c.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(c, null, 2),
        });
      });

      book.chapters?.forEach((c) => {
        indexChapters.push({ id: c.id, title: c.title });
        
        const drafts = Array.isArray(c.drafts) ? (c.drafts as Record<string, unknown>[]) : [];
        
        if (c.body === undefined && drafts.length === 0) {
          // Attempt to recover drafts from existing files so we don't nuke them from metadata.json
          for (const filePath of existingFiles.keys()) {
            if (filePath.startsWith(`${bDir}/chapters/chapter_${c.id}/`) && filePath.endsWith(".json") && !filePath.endsWith("metadata.json")) {
               const id = filePath.split("/").pop()?.replace(".json", "");
               if (id) {
                 drafts.push({ id, name: "Recovered Draft", createdAt: Date.now(), isDeleted: false });
               }
            }
          }
        }

        addFile({
          path: `${bDir}/chapters/chapter_${c.id}/metadata.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify({
            id: c.id,
            order: c.order,
            number: c.number,
            title: c.title,
            timeRef: c.timeRef,
            synopsis: c.synopsis,
            notes: c.notes,
            pinnedChars: c.pinnedChars,
            pinnedEventIds: c.pinnedEventIds,
            scenes: c.scenes,
            drafts: drafts.map((d: Record<string, unknown>) => ({
              id: d.id,
              name: d.name,
              createdAt: d.createdAt,
              isDeleted: d.isDeleted
            }))
          }, null, 2),
        });

        drafts.forEach((d: Record<string, unknown>) => {
          const draftPath = `${bDir}/chapters/chapter_${c.id}/${d.id}.json`;
          if (c.body === undefined) {
            const existingSha = existingFiles.get(draftPath);
            if (existingSha) {
              addFile({
                path: draftPath,
                mode: "100644",
                type: "blob",
                sha: existingSha,
              });
            } else {
              unseenFiles.delete(draftPath);
            }
          } else {
            addFile({
              path: draftPath,
              mode: "100644",
              type: "blob",
              content: JSON.stringify(d, null, 2),
            });
          }
        });
      });

      book.events?.forEach((e) => {
        indexEvents.push({ id: e.id, title: e.title });
        addFile({
          path: `${bDir}/events/event_${e.id}.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(e, null, 2),
        });
      });

      if (book.foreshadows) {
        addFile({
          path: `${bDir}/foreshadows.json`,
          mode: "100644",
          type: "blob",
          content: JSON.stringify(book.foreshadows, null, 2),
        });
      } else {
        const fsSha = existingFiles.get(`${bDir}/foreshadows.json`);
        if (fsSha) {
          addFile({
            path: `${bDir}/foreshadows.json`,
            mode: "100644",
            type: "blob",
            sha: fsSha,
          });
        }
      }

      // 5. index.json for fast loading
      addFile({
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

    // Explicitly delete files that are no longer in the payload
    for (const filePath of unseenFiles) {
      if (filePath.startsWith("books/")) {
        treeFiles.push({
          path: filePath,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      }
    }

    // 5. Create the Tree (using base_tree to safely preserve unchanged data)
    const createTreeRes = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeFiles }),
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

    // 7. Update the Branch Reference (Atomic check: do NOT use force: true)
    // If another request updated the branch in the meantime, this will be rejected
    // by GitHub as a non-fast-forward update, preventing race conditions.
    const updateRefRes = await fetch(
      `${baseUrl}/git/refs/heads/${branchName}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: newCommitData.sha }),
      },
    );
    if (!updateRefRes.ok) {
      if (updateRefRes.status === 422) {
        return new Response(
          JSON.stringify({
            error: "Conflict: Concurrent modification detected. Please Pull the latest changes.",
            conflict: true,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ) as unknown as CloudflareResponse;
      }
      throw new Error(`Failed to update branch reference: ${await updateRefRes.text()}`);
    }

    return new Response(JSON.stringify({ success: true, branch: branchName, sha: newCommitData.sha }), {
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
