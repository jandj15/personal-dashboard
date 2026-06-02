"use client";

import type { EventRow, TimeBlockKind } from "@/lib/types";
import { fmtDur, minuteOfDay } from "@/lib/format";

interface Props {
  events: EventRow[];
  selectedOffset: number; // 0 = today
  now: Date | null;
}

const DEFAULT_START = 8 * 60; // 08:00
const DEFAULT_END = 20 * 60; // 20:00

// Map a calendar event type to a timeline-segment kind.
const KIND: Record<EventRow["type"], TimeBlockKind> = {
  meeting: "meet",
  focus: "deep",
  personal: "break",
};

interface Seg {
  kind: TimeBlockKind;
  label: string;
  startMin: number;
  endMin: number;
}

function SegLabel({ label }: { label: string }) {
  const i = label.indexOf("·");
  if (i === -1) return <b>{label}</b>;
  return (
    <>
      <b>{label.slice(0, i).trim()}</b>
      &nbsp;· {label.slice(i + 1).trim()}
    </>
  );
}

function buildDay(events: EventRow[]) {
  const evs = events
    .map((e) => {
      const s = minuteOfDay(e.start_time);
      const en = e.end_time ? minuteOfDay(e.end_time) : s + 60;
      return { s, en: Math.max(en, s + 30), title: e.title, kind: KIND[e.type] };
    })
    .filter((x) => x.en > x.s)
    .sort((a, b) => a.s - b.s);

  let start = DEFAULT_START;
  let end = DEFAULT_END;
  if (evs.length) {
    start = Math.min(start, evs[0].s);
    end = Math.max(end, evs[evs.length - 1].en);
  }
  start = Math.floor(start / 60) * 60;
  end = Math.ceil(end / 60) * 60;

  const segs: Seg[] = [];
  let cursor = start;
  for (const e of evs) {
    const es = Math.max(e.s, cursor); // clamp overlaps
    if (es > cursor) segs.push({ kind: "free", label: "Libre", startMin: cursor, endMin: es });
    const ee = Math.min(Math.max(e.en, es + 1), end);
    if (ee > es) segs.push({ kind: e.kind, label: e.title, startMin: es, endMin: ee });
    cursor = Math.max(cursor, ee);
  }
  if (cursor < end) segs.push({ kind: "free", label: "Libre", startMin: cursor, endMin: end });

  return { start, end, segs };
}

const fmtHM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export default function TimeBarCard({ events, selectedOffset, now }: Props) {
  const dayEvents = events.filter((e) => e.day_offset === selectedOffset);
  const { start, end, segs } = buildDay(dayEvents);
  const span = Math.max(1, end - start);

  const startHour = Math.floor(start / 60);
  const endHour = Math.ceil(end / 60);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Totals per kind (minutes).
  const tot = (k: TimeBlockKind) =>
    segs.filter((s) => s.kind === k).reduce((a, s) => a + (s.endMin - s.startMin), 0);
  const cnt = (k: TimeBlockKind) => segs.filter((s) => s.kind === k).length;
  const busy = span - tot("free");
  const usage = Math.round((busy / span) * 100);

  // "AHORA" marker only on the current day.
  let nowLeft: number | null = null;
  if (selectedOffset === 0 && now) {
    const nm = now.getHours() * 60 + now.getMinutes();
    if (nm >= start && nm <= end) nowLeft = ((nm - start) / span) * 100;
  }

  const subCount = (k: TimeBlockKind) => {
    const n = cnt(k);
    return n === 1 ? "1 bloque" : `${n} bloques`;
  };

  return (
    <section className="card" data-cat="time" style={{ gridArea: "time" }}>
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Tiempo del día
          <span className="num">
            · {fmtHM(start)} – {fmtHM(end)}
          </span>
        </div>
        <div className="card-actions">
          <span>
            JORNADA · <b style={{ color: "var(--fg)" }}>{fmtDur(span)}</b>
          </span>
          <span>
            USO · <b style={{ color: "var(--fg)" }}>{usage}%</b>
          </span>
          <span style={{ color: "var(--cat-invest)" }}>
            FOCO · <b>{fmtDur(tot("deep"))}</b>
          </span>
        </div>
      </div>

      <div className="time-row">
        <div className="time-bar-wrap">
          <div className="time-scale">
            {hours.map((h) => (
              <span key={h}>{String(h).padStart(2, "0")}</span>
            ))}
          </div>
          <div className="time-bar" style={{ position: "relative" }}>
            {segs.map((b, i) => (
              <div
                className={`time-seg ${b.kind}`}
                style={{ flex: b.endMin - b.startMin }}
                key={i}
                title={`${b.label} · ${fmtHM(b.startMin)}–${fmtHM(b.endMin)}`}
              >
                <SegLabel label={b.label} />
              </div>
            ))}
            {nowLeft !== null && (
              <div className="time-now" style={{ left: `${nowLeft}%` }}></div>
            )}
          </div>
          <div className="time-scale" style={{ color: "var(--fg-dim)", paddingTop: "2px" }}>
            <span style={{ fontWeight: 600, color: "var(--fg-muted)" }}>INICIO</span>
            <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--fg-muted)" }}>
              FIN
            </span>
          </div>
        </div>

        <div className="time-legend">
          <div className="legend-row" data-k="deep">
            <span className="sw"></span>
            <span className="lbl">
              Trabajo profundo<small>{subCount("deep")}</small>
            </span>
            <span className="hrs">{fmtDur(tot("deep"))}</span>
          </div>
          <div className="legend-row" data-k="meet">
            <span className="sw"></span>
            <span className="lbl">
              Reuniones<small>{subCount("meet")}</small>
            </span>
            <span className="hrs">{fmtDur(tot("meet"))}</span>
          </div>
          <div className="legend-row" data-k="break">
            <span className="sw"></span>
            <span className="lbl">
              Personal / pausas<small>{subCount("break")}</small>
            </span>
            <span className="hrs">{fmtDur(tot("break"))}</span>
          </div>
          <div className="legend-row" data-k="free" style={{ gridColumn: "1 / -1" }}>
            <span className="sw"></span>
            <span className="lbl">
              Libre<small>{subCount("free")}</small>
            </span>
            <span className="hrs">{fmtDur(tot("free"))}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
