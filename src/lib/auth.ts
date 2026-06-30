export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("seshat-auth-token") || sessionStorage.getItem("seshat-auth-token");
};

export const clearAuthToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("seshat-auth-token");
  sessionStorage.removeItem("seshat-auth-token");
};

export const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const parts = token.split(".");
  if (parts.length < 3 || !parts[1]) throw new Error("Invalid JWT token");
  const base64Str = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padding = "==".substring(0, (3 * base64Str.length) % 4);
  const payloadStr = atob(base64Str + padding);
  return JSON.parse(decodeURIComponent(payloadStr.split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
};

export const checkTokenValidity = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const payload = decodeJwtPayload(token);
    return Date.now() < Number(payload.exp);
  } catch {
    return false;
  }
};
