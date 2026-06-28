import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";
import { signToken } from "../authUtils";

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  if (!code || !state) {
    return new Response("Missing authorization code or state", { status: 400 }) as unknown as CloudflareResponse;
  }

  // CSRF Verification: Verify the state parameter matches the secure cookie
  const cookieHeader = context.request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/oauth_state=([^;]+)/);
  const cookieState = match ? match[1] : null;

  if (!cookieState || state !== cookieState) {
    return new Response("CSRF Verification Failed. Invalid state.", { status: 403 }) as unknown as CloudflareResponse;
  }

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_SECRET } = context.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !AUTH_SECRET) {
    return new Response("Server error: Missing OAuth or Auth configuration.", { status: 500 }) as unknown as CloudflareResponse;
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (tokenData.error || !tokenData.access_token) {
      return new Response(`OAuth failed: ${tokenData.error}`, { status: 400 }) as unknown as CloudflareResponse;
    }

    // 2. Fetch user profile from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "User-Agent": "Seshat-Cloudflare-Worker"
      }
    });

    const userData = await userRes.json() as { login?: string };
    if (!userData.login) {
       return new Response("Failed to retrieve GitHub user profile", { status: 500 }) as unknown as CloudflareResponse;
    }

    // 3. Issue our own JWT mapped to the GitHub username
    const cleanUsername = userData.login.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const token = await signToken(cleanUsername, AUTH_SECRET, 7 * 24 * 60 * 60 * 1000);

    // 4. Redirect to frontend with token in the URL query string
    const redirectUrl = new URL("/auth", url.origin);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("user", cleanUsername);
    
    return Response.redirect(redirectUrl.toString(), 302) as unknown as CloudflareResponse;

  } catch (err) {
    console.error("OAuth callback error:", err);
    return new Response("Internal Server Error during OAuth callback", { status: 500 }) as unknown as CloudflareResponse;
  }
};
