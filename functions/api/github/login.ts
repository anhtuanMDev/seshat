import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";
import type { Env } from "./sync";
import { signToken } from "./authUtils";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, accessCode } = (await context.request.json()) as {
      username?: string;
      accessCode?: string;
    };
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } = context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(JSON.stringify({ error: "Missing environment variables." }), { status: 500 }) as unknown as CloudflareResponse;
    }
    if (!username || !accessCode) {
      return new Response(JSON.stringify({ error: "Missing username or accessCode." }), { status: 400 }) as unknown as CloudflareResponse;
    }

    const branchName = `user-${username.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}`;
    const cleanUsername = branchName.replace("user-", "");

    const headers = {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker",
      "Content-Type": "application/json"
    };

    const usersUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/users.json`;
    const usersRes = await fetch(usersUrl, { headers });
    
    if (!usersRes.ok) {
      return new Response(JSON.stringify({ error: "User database not found. Please register first." }), { status: 401 }) as unknown as CloudflareResponse;
    }

    const getJson = await usersRes.json() as { content: string };
    const decodedContent = decodeURIComponent(escape(atob(getJson.content)));
    const validUsers = JSON.parse(decodedContent);

    const userEntry = validUsers[cleanUsername];
    const storedCode = typeof userEntry === "object" && userEntry !== null ? userEntry.accessCode : userEntry;

    if (storedCode !== accessCode) {
      return new Response(JSON.stringify({ error: "Unauthorized. Invalid Username or Access Code." }), { status: 401 }) as unknown as CloudflareResponse;
    }

    // Generate JWT token (expires in 7 days)
    const token = await signToken(cleanUsername, AUTH_SECRET, 7 * 24 * 60 * 60 * 1000);

    return new Response(JSON.stringify({ success: true, token, username: cleanUsername }), {
      status: 200, headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 }) as unknown as CloudflareResponse;
  }
};
