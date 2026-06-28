import type { PagesFunction, Response as CloudflareResponse } from "@cloudflare/workers-types";

export interface Env {
  GITHUB_CLIENT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { GITHUB_CLIENT_ID } = context.env;
  if (!GITHUB_CLIENT_ID) {
    return new Response("Server error: Missing GITHUB_CLIENT_ID in environment variables.", { status: 500 }) as unknown as CloudflareResponse;
  }
  
  // Redirect user to GitHub's OAuth authorization page
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`;
  
  return Response.redirect(redirectUri, 302) as unknown as CloudflareResponse;
};
