import { NextResponse } from "next/server";
import { AUTH_COOKIE, createToken, safeEqual } from "@/lib/auth";

export const runtime = "nodejs";

// Best-effort, in-memory login rate limit. Per-instance only — serverless resets it
// on cold start and scales out across instances — so this is defense-in-depth, not a
// hard guarantee (a durable limit needs Vercel KV / Upstash). Enough to slow online
// brute force from a warm instance for this single-user app.
const WINDOW_MS = 5 * 60_000;
const MAX_FAILS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
function tooMany(ip: string): boolean {
  const e = attempts.get(ip);
  return Boolean(e && Date.now() <= e.resetAt && e.count >= MAX_FAILS);
}
function recordFail(ip: string): void {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else e.count++;
}

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const expected = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  // Unconfigured: convenience open in dev, but fail closed in production.
  if (!expected || !secret) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Auth not configured", { status: 503 });
    }
    return NextResponse.redirect(new URL("/", origin), 303);
  }

  const ip = clientIp(req);
  if (tooMany(ip)) {
    return NextResponse.redirect(new URL("/login?error=rate", origin), 303);
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  if (!safeEqual(password, expected)) {
    recordFail(ip);
    return NextResponse.redirect(new URL("/login?error=1", origin), 303);
  }

  attempts.delete(ip); // reset on success
  const token = await createToken(secret);
  const res = NextResponse.redirect(new URL("/", origin), 303);
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
