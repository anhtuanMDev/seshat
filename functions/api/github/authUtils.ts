export async function signToken(username: string, secret: string, expiresInMs: number = 24 * 60 * 60 * 1000): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = btoa(JSON.stringify({ u: username, exp: Date.now() + expiresInMs })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const dataToSign = `${header}.${payload}`;

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${dataToSign}.${signatureBase64}`;
}

export async function verifyToken(token: string, secret: string): Promise<{ username: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const dataToSign = `${header}.${payload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode base64url to Uint8Array
    const signatureBase64 = signature.replace(/-/g, "+").replace(/_/g, "/") + "==".substring(0, (3 * signature.length) % 4);
    const signatureRaw = atob(signatureBase64);
    const signatureArray = new Uint8Array(signatureRaw.length);
    for (let i = 0; i < signatureRaw.length; i++) {
      signatureArray[i] = signatureRaw.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, signatureArray, encoder.encode(dataToSign));
    if (!isValid) return null;

    // Decode payload
    const payloadBase64 = payload.replace(/-/g, "+").replace(/_/g, "/") + "==".substring(0, (3 * payload.length) % 4);
    const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));

    if (Date.now() > decodedPayload.exp) {
      return null; // Expired
    }

    return { username: decodedPayload.u };
  } catch {
    return null;
  }
}

export async function hashAccessCode(accessCode: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(accessCode + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(length: number = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}
