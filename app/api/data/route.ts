import { NextResponse } from "next/server";
import { loadDashboardData } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side read of the full dashboard dataset (daily tables scoped to today).
// Uses the service-role client; cookie-gated by middleware. Replaces the browser's
// direct Supabase reads so the anon key is never shipped or relied upon.
export async function GET() {
  const { data } = await loadDashboardData();
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
