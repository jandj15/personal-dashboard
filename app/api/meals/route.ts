import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { nextMealOrder } from "@/lib/applyTools";
import { todayInTz } from "@/lib/dates";
import { assertSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Meal logger writes (was the browser's anon-key Supabase calls). Cookie-gated by
// middleware + same-origin checked. Service-role client bypasses (locked) RLS.
//   { action: "create" }                  -> insert today's draft, returns the row
//   { action: "update", id, fields }      -> patch meal_type | name | kcal
//   { action: "delete", id }              -> delete by id
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
  try {
    if (action === "create") {
      const day = todayInTz();
      const sort_order = await nextMealOrder(sb, day);
      const { data, error } = await sb
        .from("meals")
        .insert({ meal_type: "Extra", name: "", kcal: 0, sort_order, logged_on: day })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, meal: data });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      const f = (body.fields ?? {}) as Record<string, unknown>;
      const fields: Record<string, unknown> = {};
      if (typeof f.meal_type === "string") fields.meal_type = f.meal_type.trim().slice(0, 40) || "Extra";
      if (typeof f.name === "string") fields.name = f.name.slice(0, 200);
      if (f.kcal !== undefined) fields.kcal = Math.max(0, Math.round(Number(f.kcal)) || 0);
      if (!Object.keys(fields).length) {
        return NextResponse.json({ ok: false, error: "no valid fields" }, { status: 400 });
      }
      const { error } = await sb.from("meals").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
      const { error } = await sb.from("meals").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
