import type { SupabaseClient } from "@supabase/supabase-js";
import IcalExpander from "ical-expander";
import { dayOffsetInTz, timeInTz } from "./dates";

// Pulls upcoming events from one or more Google Calendar private iCal URLs and
// mirrors them into the `events` table (source='gcal'). Recurring events are
// expanded into concrete occurrences within the look-ahead window. Manual/bot
// events (source='manual') are left untouched.

const HORIZON_DAYS = 14;
const MAX_ROWS = 40;

interface NormEvent {
  start: Date;
  end: Date | null;
  summary: string;
  location: string;
  allDay: boolean;
  uid: string;
}

function icsUrls(): string[] {
  return (process.env.GOOGLE_CALENDAR_ICS_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function calendarConfigured(): boolean {
  return icsUrls().length > 0;
}

export async function syncCalendar(sb: SupabaseClient): Promise<number> {
  const urls = icsUrls();
  if (!urls.length) return 0;

  const now = new Date();
  const before = new Date(now.getTime() + HORIZON_DAYS * 86_400_000);

  const items: NormEvent[] = [];
  for (const url of urls) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`iCal fetch ${res.status} for ${url.slice(0, 40)}…`);
    const ics = await res.text();
    const expander = new IcalExpander({ ics, maxIterations: 1000, skipInvalidDates: true });
    const { events, occurrences } = expander.between(now, before);

    for (const e of events) {
      items.push({
        start: e.startDate.toJSDate(),
        end: e.endDate ? e.endDate.toJSDate() : null,
        summary: e.summary ?? "",
        location: e.location ?? "",
        allDay: e.startDate.isDate,
        uid: e.uid,
      });
    }
    for (const o of occurrences) {
      items.push({
        start: o.startDate.toJSDate(),
        end: o.endDate ? o.endDate.toJSDate() : null,
        summary: o.item.summary ?? "",
        location: o.item.location ?? "",
        allDay: o.startDate.isDate,
        uid: `${o.item.uid}:${o.startDate.toJSDate().getTime()}`,
      });
    }
  }

  items.sort((a, b) => a.start.getTime() - b.start.getTime());

  const rows = items.slice(0, MAX_ROWS).map((it, i) => ({
    title: it.summary.trim() || "(sin título)",
    type: it.allDay ? "personal" : "meeting",
    day_offset: dayOffsetInTz(it.start),
    start_time: it.allDay ? "00:00" : timeInTz(it.start),
    end_time: it.end && !it.allDay ? timeInTz(it.end) : null,
    location: it.location.trim() || null,
    is_next: false,
    sort_order: i,
    source: "gcal",
    ext_id: it.uid,
  }));

  // Replace the synced set so cancelled/past events drop off; keep manual ones.
  const { error: delErr } = await sb.from("events").delete().eq("source", "gcal");
  if (delErr) throw new Error(delErr.message);
  if (rows.length) {
    const { error: insErr } = await sb.from("events").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
  return rows.length;
}
