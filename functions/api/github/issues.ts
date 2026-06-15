import { verifyToken } from "./authUtils";

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  AUTH_SECRET: string;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const number = url.searchParams.get("number");

  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const githubToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "Seshat-App",
    "Content-Type": "application/json",
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    if (number) {
      // Get a single issue and its comments
      const issueRes = await fetch(`${baseUrl}/issues/${number}`, { headers });
      if (!issueRes.ok) {
        return new Response(JSON.stringify({ error: "Issue not found" }), { status: 404 });
      }
      const issue = await issueRes.json();

      const commentsRes = await fetch(`${baseUrl}/issues/${number}/comments`, { headers });
      const comments = commentsRes.ok ? await commentsRes.json() : [];

      return new Response(JSON.stringify({ issue, comments }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Get all issues. We filter by label "seshat" so we only show issues related to this app.
      const issuesRes = await fetch(`${baseUrl}/issues?labels=seshat&state=all&sort=created&direction=desc`, { headers });
      if (!issuesRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch issues" }), { status: issuesRes.status });
      }
      const issues = await issuesRes.json();
      return new Response(JSON.stringify(issues), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const githubToken = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "Seshat-App",
    "Content-Type": "application/json",
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const body = await request.json() as {
      token?: string;
      issueNumber?: number;
      title?: string;
      body?: string;
      type?: string; // "bug" | "recommendation" | "discussion"
    };

    const token = body.token;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const payload = await verifyToken(token, env.AUTH_SECRET);
    if (!payload || !payload.username) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    const username = payload.username;
    const metaTag = `<!-- seshat-metadata {"author": "${username}"} -->\n\n`;

    if (body.issueNumber) {
      // Create a comment
      const commentBody = metaTag + (body.body || "");
      const commentRes = await fetch(`${baseUrl}/issues/${body.issueNumber}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: commentBody }),
      });

      if (!commentRes.ok) {
        const errText = await commentRes.text();
        return new Response(JSON.stringify({ error: `Failed to create comment: ${errText}` }), { status: commentRes.status });
      }

      const comment = await commentRes.json();
      return new Response(JSON.stringify(comment), { status: 201, headers: { "Content-Type": "application/json" } });
    } else {
      // Create a new issue
      const issueTitle = body.title || "Untitled Issue";
      const issueBody = metaTag + (body.body || "");
      const issueType = body.type || "discussion"; // "bug", "recommendation", "discussion"
      const labels = ["seshat", issueType];

      const issueRes = await fetch(`${baseUrl}/issues`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels,
        }),
      });

      if (!issueRes.ok) {
        const errText = await issueRes.text();
        return new Response(JSON.stringify({ error: `Failed to create issue: ${errText}` }), { status: issueRes.status });
      }

      const issue = await issueRes.json();
      return new Response(JSON.stringify(issue), { status: 201, headers: { "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
