import type {
  PagesFunction,
  Response as CloudflareResponse,
} from "@cloudflare/workers-types";
import { verifyToken } from "./authUtils";

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  AUTH_SECRET: string;
}

interface AssetEntry {
  filename: string;
  path: string;
  sha: string;
  size: number;
  mimeType: string;
}

const MIME_MAP: Record<string, string> = {
  // images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  // documents
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  flac: "audio/flac",
  ogg: "audio/ogg",
  // video
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  ogv: "video/ogg",
  // archives
  zip: "application/zip",
};

function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME_MAP[ext] || "application/octet-stream";
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get("token");
    const bookId = url.searchParams.get("bookId");

    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, AUTH_SECRET } =
      context.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !AUTH_SECRET) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables." }),
        { status: 500 },
      ) as unknown as CloudflareResponse;
    }
    if (!token || !bookId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters." }),
        { status: 400 },
      ) as unknown as CloudflareResponse;
    }

    const payload = await verifyToken(token, AUTH_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      }) as unknown as CloudflareResponse;
    }

    const username = payload.username;
    const branchName = `user-${username}`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Seshat-Cloudflare-Worker",
    };
    const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

    // Get the current branch SHA
    const branchRes = await fetch(`${baseUrl}/git/ref/heads/${branchName}`, {
      headers,
    });
    if (!branchRes.ok) {
      // Branch doesn't exist yet — return empty assets list
      return new Response(
        JSON.stringify({ assets: [], branchSha: null }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as unknown as CloudflareResponse;
    }
    const branchData = (await branchRes.json()) as { object: { sha: string } };
    const branchSha = branchData.object.sha;

    // Use GraphQL to list all files in the assets folder
    const assetsPrefix = `books/book_${bookId}/assets/`;
    const graphqlRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `{
          repository(owner: "${GITHUB_OWNER}", name: "${GITHUB_REPO}") {
            object(expression: "${branchName}:books/book_${bookId}/assets") {
              ... on Tree {
                entries {
                  name
                  oid
                  object {
                    ... on Blob {
                      byteSize
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });

    if (!graphqlRes.ok) {
      return new Response(
        JSON.stringify({ assets: [], branchSha }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as unknown as CloudflareResponse;
    }

    const gqlData = (await graphqlRes.json()) as {
      data?: {
        repository?: {
          object?: {
            entries?: Array<{
              name: string;
              oid: string;
              object?: { byteSize?: number };
            }>;
          };
        };
      };
    };

    const entries =
      gqlData?.data?.repository?.object?.entries || [];

    const assets: AssetEntry[] = entries.map((entry) => ({
      filename: entry.name,
      path: `${assetsPrefix}${entry.name}`,
      sha: entry.oid,
      size: entry.object?.byteSize || 0,
      mimeType: guessMime(entry.name),
    }));

    return new Response(
      JSON.stringify({ assets, branchSha }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ) as unknown as CloudflareResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    ) as unknown as CloudflareResponse;
  }
};
