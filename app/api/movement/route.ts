import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { applyTool } from "@/lib/applyTools";
import { safeEqual } from "@/lib/auth";

export const runtime = "nodejs";

// Ingest endpoint for Apple Health → dashboard. An iPhone Shortcut (Personal
// Automation) reads today's Health metrics and POSTs them here as JSON. Writes
// today's row in `movement` (upsert by day, Europe/Madrid). Token-secured.
//
// POST /api/movement
//   header: x-ingest-secret: <MOVEMENT_INGEST_SECRET>
//   body (any subset, numbers or numeric strings):
//   { "steps": 9000, "move_kcal": 480, "exercise_min": 35, "stand_h": 10,
//     "distance_km": 6.4, "resting_hr": 58, "workouts": 1 }

const FIELDS = [
  "move_kcal", "exercise_min", "stand_h", "steps",
  "distance_km", "resting_hr", "workouts",
] as const;

// Every column is an integer except distance_km (numeric). Health stats can come
// back fractional (e.g. 0.006), so round int fields to avoid Postgres rejecting them.
const FLOAT_FIELDS = new Set(["distance_km"]);

export async function POST(req: Request) {
  const secret = process.env.MOVEMENT_INGEST_SECRET;
  // Never run open in production: require the ingest secret to be configured.
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "ingest secret not configured" }, { status: 503 });
  }
  if (secret) {
    const got = req.headers.get("x-ingest-secret");
    if (!safeEqual(got ?? "", secret)) {
      return NextResponse.json({ ok: false, error: "bad secret" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Whitelist + drop empty/NaN values so a Shortcut can post partial data.
  const fields: Record<string, number> = {};
  for (const k of FIELDS) {
    const raw = body[k];
    if (raw === undefined || raw === null || raw === "") continue;
    const n = Number(raw);
    if (Number.isNaN(n)) continue;
    fields[k] = FLOAT_FIELDS.has(k) ? n : Math.round(n);
  }
  if (!Object.keys(fields).length) {
    return NextResponse.json({ ok: false, error: "no valid metrics" }, { status: 400 });
  }

  const sb = getServerSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase not configured" }, { status: 500 });
  }

  try {
    await applyTool(sb, "update_movement", fields);
    return NextResponse.json({ ok: true, written: fields });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "movement ingest ready" });
}
