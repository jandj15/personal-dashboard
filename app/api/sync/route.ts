import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { syncCalendar, calendarConfigured } from "@/lib/syncCalendar";
import { syncGmail, gmailConfigured } from "@/lib/syncGmail";

export const runtime = "nodejs";

// Pulls Google Calendar (iCal) + Gmail (IMAP) into the dashboard tables.
// Triggered by the dashboard on load/focus; rate-limited via sync_state so
// frequent triggers don't hammer Google. Gated by the password middleware
// (the browser sends the auth cookie automatically). Pass ?force=1 to bypass
// the rate limit (manual test).

const STALE_MS = 10 * 60_000; // re-sync at most every 10 minutes

export async function GET(req: Request) {
  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 500 });
  }

  const force = new URL(req.url).searchParams.get("force") === "1";
  const now = Date.now();

  const { data: state } = await sb
    .from("sync_state")
    .select("calendar_at,gmail_at")
    .eq("id", "default")
    .maybeSingle();

  const stale = (iso: string | null | undefined) =>
    force || !iso || now - new Date(iso).getTime() > STALE_MS;

  const out: Record<string, unknown> = { ok: true };
  const errors: Record<string, string> = {};
  const stamp: Record<string, string> = {};
  const nowIso = new Date(now).toISOString();

  if (calendarConfigured() && stale(state?.calendar_at)) {
    try {
      out.calendar = await syncCalendar(sb);
      stamp.calendar_at = nowIso;
    } catch (e) {
      errors.calendar = (e as Error).message;
    }
  } else {
    out.calendar = "skipped";
  }

  if (gmailConfigured() && stale(state?.gmail_at)) {
    try {
      out.gmail = await syncGmail(sb);
      stamp.gmail_at = nowIso;
    } catch (e) {
      errors.gmail = (e as Error).message;
    }
  } else {
    out.gmail = "skipped";
  }

  if (Object.keys(stamp).length) {
    await sb.from("sync_state").upsert({ id: "default", ...stamp }, { onConflict: "id" });
  }
  if (Object.keys(errors).length) out.errors = errors;

  return NextResponse.json(out);
}
