// Same-origin guard for cookie-authenticated, state-changing API routes.
// The auth cookie is SameSite=Lax (browsers won't send it on cross-site POST),
// so this is defense-in-depth: these endpoints are only ever called by the
// dashboard's own same-origin fetch, which always sends an Origin header.
export function assertSameOrigin(req: Request): boolean {
  const target = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin) return origin === target;
  // Fall back to Referer; reject if neither is present on a state change.
  const referer = req.headers.get("referer");
  if (referer) return referer === target || referer.startsWith(`${target}/`);
  return false;
}
