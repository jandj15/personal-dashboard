"use client";

import type { MovementRow } from "@/lib/types";
import { fmtInt, fmtNum1 } from "@/lib/format";

interface Props {
  movement: MovementRow;
}

const ring = (r: number, value: number, goal: number) => {
  const circ = 2 * Math.PI * r;
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;
  return { dasharray: circ.toFixed(2), dashoffset: (circ * (1 - progress)).toFixed(1) };
};

export default function MovementCard({ movement: m }: Props) {
  const move = ring(46, m.move_kcal, m.move_goal);
  const exc = ring(34, m.exercise_min, m.exercise_goal);
  const stand = ring(22, m.stand_h, m.stand_goal);
  const centerPct = m.move_goal > 0 ? Math.round((m.move_kcal / m.move_goal) * 100) : 0;

  return (
    <section
      className="card"
      data-cat="habits"
      style={{ gridArea: "mov", "--accent": "oklch(0.66 0.21 18)" } as React.CSSProperties}
    >
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Movimiento <span className="num">· actividad hoy</span>
        </div>
        <div className="card-actions">
          <span>
            SINC · <b style={{ color: "var(--fg)" }}>Watch</b>
          </span>
        </div>
      </div>

      <div className="move-row">
        <div className="rings">
          <svg viewBox="0 0 116 116">
            <circle className="ring-track ring-move" cx="58" cy="58" r="46" />
            <circle
              className="ring-val ring-move"
              cx="58"
              cy="58"
              r="46"
              strokeDasharray={move.dasharray}
              strokeDashoffset={move.dashoffset}
            />
            <circle className="ring-track ring-exc" cx="58" cy="58" r="34" />
            <circle
              className="ring-val ring-exc"
              cx="58"
              cy="58"
              r="34"
              strokeDasharray={exc.dasharray}
              strokeDashoffset={exc.dashoffset}
            />
            <circle className="ring-track ring-stand" cx="58" cy="58" r="22" />
            <circle
              className="ring-val ring-stand"
              cx="58"
              cy="58"
              r="22"
              strokeDasharray={stand.dasharray}
              strokeDashoffset={stand.dashoffset}
            />
          </svg>
          <div className="rings-center">
            {centerPct}%
            <br />
            OBJETIVO
          </div>
        </div>

        <div className="move-metrics">
          <div className="move-metric move">
            <span className="mm-lbl">
              <i></i> Movimiento
            </span>
            <span className="mm-val">{fmtInt(m.move_kcal)}</span>
            <span className="mm-goal">/ {fmtInt(m.move_goal)} kcal</span>
          </div>
          <div className="move-metric exc">
            <span className="mm-lbl">
              <i></i> Ejercicio
            </span>
            <span className="mm-val">{m.exercise_min}</span>
            <span className="mm-goal">/ {m.exercise_goal} min</span>
          </div>
          <div className="move-metric stand">
            <span className="mm-lbl">
              <i></i> De pie
            </span>
            <span className="mm-val">{m.stand_h}</span>
            <span className="mm-goal">/ {m.stand_goal} h</span>
          </div>

          <div className="move-stats move-stats-2">
            <div className="move-stat">
              <span className="ms-n">{fmtInt(m.steps)}</span>
              <span className="ms-l">Pasos</span>
            </div>
            <div className="move-stat">
              <span className="ms-n">
                {fmtNum1(m.distance_km)}
                <small>km</small>
              </span>
              <span className="ms-l">Distancia</span>
            </div>
            <div className="move-stat">
              <span className="ms-n">
                {m.resting_hr}
                <small>ppm</small>
              </span>
              <span className="ms-l">FC reposo</span>
            </div>
            <div className="move-stat">
              <span className="ms-n">{m.workouts}</span>
              <span className="ms-l">Entrenos</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
