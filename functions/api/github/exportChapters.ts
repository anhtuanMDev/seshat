import { verifyToken } from "./authUtils";

export async function onRequestGet({ request, env }: { request: Request; env: Record<string, string> }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const bookId = url.searchParams.get("bookId");
  const chapterIds = url.searchParams.get("chapterIds");

  if (!token) return new Response("Unauthorized", { status: 401 });
  if (!bookId) return new Response("Missing bookId", { status: 400 });
  if (!chapterIds) return new Response("Missing chapterIds", { status: 400 });

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

    const branchRes = await fetch(`${baseUrl}/git/refs/heads/${branchName}`, { headers });
    if (!branchRes.ok) return new Response(JSON.stringify({ error: "Branch not found" }), { status: 404 });
    const branchData = await branchRes.json() as { object: { sha: string } };

    const treeRes = await fetch(`${baseUrl}/git/trees/${branchData.object.sha}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error("Failed to fetch repository tree.");
    const treeData = await treeRes.json() as { tree: { path: string; sha: string; type: string }[] };

    const ids = chapterIds.split(",").map((s) => s.trim());
    const chapterDirPrefixes = ids.map((id) => `books/book_${bookId}/chapters/chapter_${id}/`);

    const blobs = treeData.tree.filter(
      (f) => f.type === "blob" && chapterDirPrefixes.some((p) => f.path.startsWith(p)),
    );

    const fileContents: Record<string, string> = {};
    const CHUNK_SIZE = 100;

    for (let i = 0; i < blobs.length; i += CHUNK_SIZE) {
      const chunk = blobs.slice(i, i + CHUNK_SIZE);
      const query = `query {
        repository(owner: "${owner}", name: "${repo}") {
          ${chunk.map((blob, index) => `
            blob${index}: object(oid: "${blob.sha}") {
              ... on Blob { text }
            }
          `).join("")}
        }
      }`;

      const graphqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST", headers, body: JSON.stringify({ query }),
      });

      if (!graphqlRes.ok) continue;
      const graphqlData = await graphqlRes.json() as { data?: { repository: Record<string, { text?: string | null }> } };

      if (graphqlData.data?.repository) {
        chunk.forEach((blob, index) => {
          const blobData = graphqlData.data!.repository[`blob${index}`];
          if (blobData && typeof blobData.text === "string") {
            fileContents[blob.path] = blobData.text;
          }
        });
      }
    }

    const chapters: Record<string, unknown>[] = [];

    for (const id of ids) {
      const prefix = `books/book_${bookId}/chapters/chapter_${id}/`;
      let metadata: Record<string, unknown> | null = null;
      const draftFiles: { path: string; data: Record<string, unknown> }[] = [];

      for (const [path, content] of Object.entries(fileContents)) {
        if (!path.startsWith(prefix)) continue;
        try {
          const data = JSON.parse(content) as Record<string, unknown>;
          if (path.endsWith("metadata.json")) {
            metadata = data;
          } else if (path.endsWith(".json")) {
            draftFiles.push({ path, data });
          }
        } catch { /* skip parse errors */ }
      }

      if (metadata) {
        const activeDraftId = (metadata.activeDraftId as string) || (metadata.drafts as { id: string }[])?.[0]?.id;
        let body = "";
        if (activeDraftId) {
          const draft = draftFiles.find((d) => d.path.endsWith(`/${activeDraftId}.json`));
          if (draft) body = (draft.data.body as string) || "";
        }
        chapters.push({ ...metadata, body, drafts: metadata.drafts || [] });
      }
    }

    return new Response(JSON.stringify({ chapters }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
