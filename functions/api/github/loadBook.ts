import { verifyToken } from "./sync";

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
    if (!payload || !payload.u) return new Response("Invalid token", { status: 401 });
    const username = payload.u as string;
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
    for (let i = 0; i < blobs.length; i += 10) {
      const chunk = blobs.slice(i, i + 10);
      const promises = chunk.map(async (blob) => {
        const blobRes = await fetch(`${baseUrl}/git/blobs/${blob.sha}`, { headers });
        if (blobRes.ok) {
          const blobData = await blobRes.json() as { content: string; encoding: string };
          if (blobData.encoding === "base64") {
             fileContents[blob.path] = decodeURIComponent(escape(atob(blobData.content.replace(/\n/g, ""))));
          } else {
             fileContents[blob.path] = blobData.content;
          }
        }
      });
      await Promise.all(promises);
    }

    const book: Record<string, unknown> = {
      id: bookId, title: "Unknown", synopsis: "", setting: "", themes: "", rules: "",
      nations: [], techniques: [], ingredients: [], monsters: [], treasures: [],
      characters: [], chapters: [], events: [], isFullyLoaded: true
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
        (book.chapters as Record<string, unknown>[]).push(data);
      } else if (path.includes("/events/")) {
        (book.events as Record<string, unknown>[]).push(data);
      }
    }

    return new Response(JSON.stringify({ book }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
