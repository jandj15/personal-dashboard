// Runtime-agnostic auth helpers (Web Crypto only — works in Edge middleware
// and Node route handlers). Stateless, signed, expiring session token.

export const AUTH_COOKIE = "pd_auth";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();

/** Length-safe, constant-time string compare. Works in Edge + Node (no Buffer). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** `${exp}.${hmac(exp)}` */
export async function createToken(secret: string): Promise<string> {
  const exp = String(Date.now() + SESSION_TTL_MS);
  const sig = await hmacHex(secret, exp);
  return `${exp}.${sig}`;
}

export async function verifyToken(
  secret: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = await hmacHex(secret, exp);
  if (!safeEqual(sig, expect)) return false;
  const expMs = Number(exp);
  return Number.isFinite(expMs) && expMs > Date.now();
}

/** Auth is enforced only when both secrets are configured (dev runs ungated). */
export function authConfigured(): boolean {
  return Boolean(process.env.DASHBOARD_PASSWORD && process.env.AUTH_SECRET);
}
