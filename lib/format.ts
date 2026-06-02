// es-ES formatting + Spanish date helpers (matches the design mockup's locale)

// `useGrouping: "always"` overrides Spanish ICU's minimumGroupingDigits=2 rule,
// which would otherwise drop the separator on 4-digit numbers (1400 → "1400").
// Cast: the bundled lib types `useGrouping` as boolean and don't know the string union.
const GROUP = { useGrouping: "always" } as unknown as Intl.NumberFormatOptions;

export const fmtInt = (n: number) =>
  Math.round(n).toLocaleString("es-ES", GROUP);

export const fmtEur2 = (n: number) =>
  n.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...GROUP,
  });

export const fmtNum1 = (n: number) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtPct = (n: number) => {
  const s = Math.abs(n).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "−" : "+"}${s}%`;
};

const DOW_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DOW_CAL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "mié 22 abr 2026" */
export const fmtLongDate = (d: Date) =>
  `${DOW_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;

export const dowCal = (d: Date) => DOW_CAL[d.getDay()];

export const greetingWord = (d: Date) => {
  const h = d.getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
};

/** Midnight of the given date (local). */
export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Whole-day delta b - a (calendar days). */
export const dayDelta = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);

/** Monday-start week (7 dates) containing `d`. */
export const weekDays = (d: Date): Date[] => {
  const base = startOfDay(d);
  const dow = (base.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x;
  });
};

/** Combine a relative day_offset + "HH:MM" into an absolute Date anchored to `now`. */
export const eventDate = (now: Date, dayOffset: number, time: string): Date => {
  const [h, m] = time.split(":").map(Number);
  const d = startOfDay(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
};

/** "00:23:47" countdown for sub-24h, otherwise "2d 04:10". */
export const fmtCountdown = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const h = Math.floor((totalSec % 86_400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(h)}:${pad(m)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Minute-of-day for "HH:MM". */
export const minuteOfDay = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** "2h 00m" / "1h" / "45m" from a minute count. */
export const fmtDur = (min: number) => {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};
