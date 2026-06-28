import type {
  PagesFunction,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";
import { verifyToken } from "../github/authUtils";

interface Env {
  AUTH_SECRET: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { AI_API_KEY, AI_BASE_URL, AUTH_SECRET } = context.env;
    if (!AI_API_KEY) {
      return new Response(JSON.stringify({ error: "Server AI configuration missing. Set AI_API_KEY in Cloudflare environment variables." }), { status: 500 }) as unknown as CloudflareResponse;
    }
    
    // Auth check to prevent open proxy abuse
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) as unknown as CloudflareResponse;
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized. Invalid or expired token." }), { status: 401 }) as unknown as CloudflareResponse;
    }

    const body = await context.request.text();
    
    // Support OpenAI, OpenRouter, Anthropic by allowing configurable AI_BASE_URL
    const targetUrl = AI_BASE_URL 
      ? `${AI_BASE_URL.replace(/\/$/, "")}/chat/completions` 
      : "https://api.openai.com/v1/chat/completions";

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`
      },
      body
    });

    // Cloudflare Workers handle streaming responses automatically by passing the body
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "Access-Control-Allow-Origin": "*",
      }
    }) as unknown as CloudflareResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }) as unknown as CloudflareResponse;
  }
};
