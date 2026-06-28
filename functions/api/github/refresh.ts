import { verifyToken, signToken } from "./authUtils";

interface Env {
  SESHAT_AUTH_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const request = context.request;
  const env = context.env;
  
  // CORS handled by _middleware, but we expect POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid token" }), { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  
  if (!env.SESHAT_AUTH_SECRET) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
  }

  const decoded = await verifyToken(token, env.SESHAT_AUTH_SECRET);
  if (!decoded) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });
  }

  // Issue new token valid for 7 days
  const newToken = await signToken(decoded.username, env.SESHAT_AUTH_SECRET, 7 * 24 * 60 * 60 * 1000);

  return new Response(JSON.stringify({ token: newToken }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
