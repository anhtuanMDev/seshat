import { verifyToken } from "./authUtils";

export async function onRequestGet({ request, env }: { request: Request; env: Record<string, string> }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const bookId = url.searchParams.get("bookId");

  if (!token) return new Response("Unauthorized", { status: 401 });
  if (!bookId) return new Response("Missing bookId", { status: 400 });

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

    const blobs = treeData.tree.filter(f => f.type === "blob" && f.path.startsWith(`books/book_${bookId}/`));
    
    if (blobs.length === 0) {
       return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });
    }

    const fileContents: Record<string, string> = {};
    const CHUNK_SIZE = 100;
    
    for (let i = 0; i < blobs.length; i += CHUNK_SIZE) {
      const chunk = blobs.slice(i, i + CHUNK_SIZE);
      
      const query = `query {
        repository(owner: "${owner}", name: "${repo}") {
          ${chunk.map((blob, index) => `
            blob${index}: object(oid: "${blob.sha}") {
              ... on Blob {
                text
              }
            }
          `).join("")}
        }
      }`;

      const graphqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({ query })
      });

      if (!graphqlRes.ok) {
        console.error("GraphQL request failed:", await graphqlRes.text());
        continue;
      }

      const graphqlData = await graphqlRes.json() as { data?: { repository: Record<string, { text?: string | null }> }, errors?: unknown };
      
      if (graphqlData.errors) {
        console.error("GraphQL returned errors:", graphqlData.errors);
      }

      if (graphqlData.data && graphqlData.data.repository) {
        chunk.forEach((blob, index) => {
          const blobData = graphqlData.data!.repository[`blob${index}`];
          if (blobData && typeof blobData.text === "string") {
            fileContents[blob.path] = blobData.text;
          }
        });
      }
    }

    const book: Record<string, unknown> = {
      id: bookId, title: "Unknown", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      characters: [], chapters: [], events: [], foreshadows: [], isFullyLoaded: true
    };
    
    for (const [path, content] of Object.entries(fileContents)) {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(content) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (path.endsWith("book.json")) {
        book.title = data.title;
        book.synopsis = data.synopsis || "";
        book.setting = data.setting || "";
        book.themes = data.themes || "";
        book.rules = data.rules || "";
      } else if (path.includes("/world/")) {
        if (path.includes("/nations/")) (book.nations as Record<string, unknown>[]).push(data);
        else if (path.includes("/techniques/")) (book.techniques as Record<string, unknown>[]).push(data);
        else if (path.includes("/ingredients/")) (book.ingredients as Record<string, unknown>[]).push(data);
        else if (path.includes("/monsters/")) (book.monsters as Record<string, unknown>[]).push(data);
        else if (path.includes("/treasures/")) (book.treasures as Record<string, unknown>[]).push(data);
      } else if (path.includes("/characters/")) {
        (book.characters as Record<string, unknown>[]).push(data);
      } else if (path.includes("/chapters/")) {
        const chapterData = { ...data };
        delete chapterData.body;
        delete chapterData.drafts;
        (book.chapters as Record<string, unknown>[]).push(chapterData);
      } else if (path.includes("/events/")) {
        (book.events as Record<string, unknown>[]).push(data);
      } else if (path.endsWith("foreshadows.json")) {
        book.foreshadows = Array.isArray(data) ? data : data.foreshadows || [];
      }
    }

    return new Response(JSON.stringify({ book }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
