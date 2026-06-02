import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Task check-off (was the browser's anon-key Supabase update). Cookie-gated by
// middleware + same-origin checked. Server stamps completed_at.
//   { action: "complete", id }
export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad origin" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 503 });
  }

  const action = String(body.action ?? "");
  const id = String(body.id ?? "");
  if (action !== "complete") {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

  const { error } = await sb
    .from("tasks")
    .update({ done: true, completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
