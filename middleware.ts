import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authConfigured, verifyToken } from "@/lib/auth";

// Paths that bypass the password gate.
const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/telegram", "/api/movement"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // When no password/secret configured: open in dev (convenience), but FAIL CLOSED
  // in production so a deploy that forgot the env vars is never silently wide open.
  if (!authConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Auth not configured", { status: 503 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const ok = await verifyToken(process.env.AUTH_SECRET as string, token);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals + common static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
