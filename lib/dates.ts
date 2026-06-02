// Day-boundary helpers. Daily data (meals, movement, consumed macros/water) is
// scoped to "today" in APP_TZ and resets at local midnight.

export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || "Europe/Madrid";

/** Today's date as "YYYY-MM-DD" in APP_TZ. */
export function todayInTz(d: Date = new Date(), tz: string = APP_TZ): string {
  // en-CA formats as YYYY-MM-DD
  return d.toLocaleDateString("en-CA", { timeZone: tz });
}

/** "HH:MM" (24h) for a date in APP_TZ. */
export function timeInTz(d: Date, tz: string = APP_TZ): string {
  return d.toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Whole-day offset of `d` from now, counted by APP_TZ calendar days
 *  (0 = today, +1 = tomorrow, -1 = yesterday). */
export function dayOffsetInTz(d: Date, now: Date = new Date(), tz: string = APP_TZ): number {
  const a = todayInTz(now, tz); // YYYY-MM-DD
  const b = todayInTz(d, tz);
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}
