"use client";

import type { EventRow } from "@/lib/types";
import { dayDelta, dowCal, eventDate, fmtCountdown, weekDays } from "@/lib/format";

interface Props {
  events: EventRow[];
  now: Date | null;
  selectedOffset: number; // 0 = today
  onSelectDay: (offset: number) => void;
}

const TAG: Record<EventRow["type"], string> = {
  meeting: "REU",
  focus: "FOCO",
  personal: "PER",
};

export default function CalendarCard({ events, now, selectedOffset, onSelectDay }: Props) {
  const ref = now ?? new Date();
  const days = weekDays(ref);

  const dotsFor = (d: Date) => {
    const delta = dayDelta(ref, d);
    return events.filter((e) => e.day_offset === delta).length;
  };

  // Events for the SELECTED day, soonest first.
  const base = now ?? ref;
  const dayEvents = events
    .filter((e) => e.day_offset === selectedOffset)
    .map((e) => ({ e, d: eventDate(base, e.day_offset, e.start_time) }))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  const isCurrentDay = selectedOffset === 0;
  // The "next" event (countdown target) only exists on the current day.
  const nextIdx =
    isCurrentDay && now ? dayEvents.findIndex((x) => x.d.getTime() >= now.getTime()) : -1;

  const metaLine = (e: EventRow) => {
    const range = e.end_time ? `${e.start_time}–${e.end_time}` : e.start_time;
    return [range, e.location].filter(Boolean).join(" · ");
  };

  return (
    <section className="card row-1-card" data-cat="cal" style={{ gridArea: "cal" }}>
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Calendario · 7 días
        </div>
        <div className="card-actions">
          {!isCurrentDay && (
            <button className="day-jump" title="volver a hoy" type="button" onClick={() => onSelectDay(0)}>
              HOY
            </button>
          )}
        </div>
      </div>

      <div className="cal-week">
        {days.map((d, i) => {
          const delta = dayDelta(ref, d);
          const isToday = delta === 0;
          const isPast = delta < 0;
          const isSel = delta === selectedOffset;
          const cls = `cal-day${isToday ? " today" : ""}${isPast ? " past" : ""}${isSel ? " selected" : ""}`;
          const dots = Math.min(dotsFor(d), 4);
          return (
            <button className={cls} key={i} type="button" onClick={() => onSelectDay(delta)}>
              <div className="dow">{isToday ? `Hoy · ${dowCal(d)}` : dowCal(d)}</div>
              <div className="dnum">{d.getDate()}</div>
              <div className="dots">
                {Array.from({ length: dots }, (_, k) => (
                  <i key={k}></i>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="upcoming">
        {dayEvents.length === 0 && <div className="ev-empty">Sin eventos este día</div>}
        {dayEvents.map((x, i) => {
          const e = x.e;
          const isNext = i === nextIdx;
          const isPast = isCurrentDay && now ? x.d.getTime() < now.getTime() : false;
          return (
            <div
              className={`ev-row${isNext ? " ev-next" : ""}${isPast ? " past" : ""}`}
              data-type={e.type}
              key={e.id}
            >
              <span className="t">{e.start_time}</span>
              <span className="name">
                {e.title}
                {isNext && <em className="ev-sub">{metaLine(e)}</em>}
              </span>
              {isNext && now ? (
                <span className="ev-cd">
                  <b suppressHydrationWarning>{fmtCountdown(x.d.getTime() - now.getTime())}</b>
                  <small>PRÓX.</small>
                </span>
              ) : (
                <span className="tag">{TAG[e.type]}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
