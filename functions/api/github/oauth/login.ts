import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";

export interface Env {
  GITHUB_CLIENT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { GITHUB_CLIENT_ID } = context.env;
  if (!GITHUB_CLIENT_ID) {
    return new Response("Server error: Missing GITHUB_CLIENT_ID in environment variables.", { status: 500 }) as unknown as CloudflareResponse;
  }
  
  // Generate cryptographically random state to prevent CSRF
  const state = crypto.randomUUID();
  
  // Redirect user to GitHub's OAuth authorization page
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user&state=${state}`;
  
  const response = new Response(null, {
    status: 302,
    headers: {
      "Location": redirectUri,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; Secure; Path=/api/github/oauth; Max-Age=600; SameSite=Lax`
    }
  });
  
  return response as unknown as CloudflareResponse;
};
