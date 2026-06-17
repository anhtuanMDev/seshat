import type {
  PagesFunction,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";
import { hashAccessCode, generateSalt } from "./authUtils";
import type { Env } from "./sync";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, email, accessCode } = (await context.request.json()) as {
      username?: string;
      email?: string;
      accessCode?: string;
    };
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return new Response(
        JSON.stringify({ error: "Missing GitHub environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (!username || !accessCode) {
      return new Response(
        JSON.stringify({ error: "Missing username or accessCode." }),
        { status: 400 },
      ) as unknown as CloudflareResponse;
    }

    const cleanUsername = username.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker",
      "Content-Type": "application/json",
    };

    const usersUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/users.json`;

    // 1. Fetch current users.json from main branch
    let usersData: Record<
      string,
      | string
      | { accessCode: string; email: string }
      | { hash: string; salt: string; email: string }
    > = {};
    let currentSha: string | undefined;

    const getRes = await fetch(usersUrl, { headers });

    if (getRes.ok) {
      const getJson = (await getRes.json()) as { sha: string; content: string };
      currentSha = getJson.sha;
      try {
        const decodedContent = decodeURIComponent(
          escape(atob(getJson.content)),
        );
        usersData = JSON.parse(decodedContent);
      } catch (e) {
        console.error("Failed to parse users.json", e);
      }
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return new Response(
        JSON.stringify({ error: `Failed to access user database. Status: ${getRes.status}, Error: ${errText}` }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }

    // 2. Check if user already exists
    if (usersData[cleanUsername]) {
      return new Response(
        JSON.stringify({
          error: "Username already exists. Please login instead.",
        }),
        { status: 409 },
      ) as unknown as CloudflareResponse;
    }

    // 3. Add new user with salted hash
    const salt = generateSalt();
    const hash = await hashAccessCode(accessCode, salt);
    usersData[cleanUsername] = { hash, salt, email: email || "" };
    const newContent = JSON.stringify(usersData, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(newContent)));


    // 4. Save updated users.json back to main branch
    const putBody: Record<string, string> = {
      message: `Register new user: ${cleanUsername}`,
      content: base64Content,
    };
    if (currentSha) putBody.sha = currentSha;

    const putRes = await fetch(usersUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to save registration: " + errText }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }

    return new Response(
      JSON.stringify({ success: true, username: cleanUsername }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ) as unknown as CloudflareResponse;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    }) as unknown as CloudflareResponse;
  }
};
