const { webcrypto: crypto } = require("crypto");
async function verifyToken(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const dataToSign = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBase64 = signature.replace(/-/g, "+").replace(/_/g, "/") + "==".substring(0, (3 * signature.length) % 4);
    const signatureRaw = Buffer.from(signatureBase64, 'base64').toString('binary');
    const signatureArray = new Uint8Array(signatureRaw.length);
    for (let i = 0; i < signatureRaw.length; i++) {
      signatureArray[i] = signatureRaw.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, signatureArray, new TextEncoder().encode(dataToSign));
    if (!isValid) return "invalid signature";

    return "success";
  } catch (err) {
    return "error: " + err.message;
  }
}
verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1IjoiYWxleCIsImV4cCI6MTc4MTA3MTc2MTMzNH0.Ew_r3FOhl4cAZd5RhchR-jAUSGl31Olj4ngB9SWmTew", "IVLTes9xh106QfLXZd9D5Yb80wmjU1A0").then(console.log);
