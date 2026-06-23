import { verifyToken } from "./authUtils";

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

  const githubToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "Seshat-App",
    "Content-Type": "application/json",
  };

  try {
    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username)
      return new Response("Invalid token", { status: 401 });
    const username = payload.username as string;
    const branchName = `user-${username}`;

    const query = `query {
      repository(owner: "${owner}", name: "${repo}") {
        object(expression: "${branchName}:books/book_${bookId}/${path}") {
          ... on Blob {
            text
          }
        }
      }
    }`;

    const graphqlRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    if (!graphqlRes.ok) {
      return new Response(JSON.stringify({ error: "GraphQL request failed" }), {
        status: 500,
      });
    }

    const graphqlData = (await graphqlRes.json()) as {
      data?: { repository: { object?: { text?: string | null } } };
      errors?: unknown;
    };

    if (graphqlData.errors || !graphqlData.data?.repository?.object) {
      return new Response(
        JSON.stringify({ error: "File not found or GraphQL error" }),
        { status: 404 },
      );
    }

    const content = graphqlData.data.repository.object.text;

    return new Response(content || "{}", {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
}
