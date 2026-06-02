"use client";

import { forwardRef } from "react";
import type { PortfolioPosition, PortfolioRow } from "@/lib/types";
import { fmtEur2, fmtInt, fmtPct } from "@/lib/format";

interface Props {
  portfolio: PortfolioRow;
  positions: PortfolioPosition[];
  open: boolean;
}

function sparklinePaths(series: number[]) {
  const n = series.length;
  if (n < 2) return { line: "", area: "" };
  const step = 320 / (n - 1);
  const pts = series.map((y, i) => `${(i * step).toFixed(1)},${y}`);
  const line = "M" + pts.join(" L");
  const area = `${line} L320,56 L0,56 Z`;
  const lastX = (320).toFixed(1);
  const lastY = series[n - 1];
  return { line, area, lastX, lastY };
}

const CarteraPopover = forwardRef<HTMLDivElement, Props>(function CarteraPopover(
  { portfolio, positions, open },
  ref
) {
  const { line, area, lastX, lastY } = sparklinePaths(portfolio.series_30d);
  const deltaNeg = portfolio.day_change_eur < 0;

  return (
    <div
      ref={ref}
      className={`cartera-pop${open ? " open" : ""}`}
      data-cat="invest"
    >
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Cartera · 30 días
        </div>
        <div className="card-actions">
          <span>1D</span>
          <span style={{ color: "var(--fg)" }}>30D</span>
          <span>1A</span>
        </div>
      </div>
      <div className="invest-head">
        <div className="invest-total">
          <div className="lbl">VALOR TOTAL</div>
          <div className="val" style={{ fontSize: "21px" }}>
            <span className="cur">€</span>
            <span>{fmtEur2(portfolio.total_eur)}</span>
          </div>
        </div>
        <div className="invest-delta">
          <div className={`d${deltaNeg ? " neg" : ""}`} style={{ fontSize: "13px" }}>
            <span style={{ whiteSpace: "nowrap" }}>
              {deltaNeg ? "−" : "+"}€{fmtEur2(Math.abs(portfolio.day_change_eur))}{" "}
              <span
                style={{
                  color: "var(--fg-muted)",
                  fontWeight: 500,
                  fontSize: "11px",
                  marginLeft: "3px",
                }}
              >
                {fmtPct(portfolio.day_change_pct)}
              </span>
            </span>
          </div>
          <div className="lbl">VARIACIÓN HOY</div>
        </div>
      </div>
      <div className="pop-mini-chart">
        <svg viewBox="0 0 320 56" preserveAspectRatio="none">
          <defs>
            <linearGradient id="igpop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.74 0.14 295)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="oklch(0.74 0.14 295)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#igpop)" />
          <path d={line} fill="none" stroke="oklch(0.74 0.14 295)" strokeWidth="1.5" />
          <circle cx={lastX} cy={lastY} r="3" fill="oklch(0.74 0.14 295)" />
        </svg>
      </div>
      <div className="pop-pos">
        {positions.map((p) => (
          <div className="pop-pos-row" key={p.id}>
            <span className="sym">{p.sym}</span>
            <span className="nm">
              {p.name} · {p.alloc_pct}%
            </span>
            <span className="vv">€{fmtInt(p.value_eur)}</span>
            <span className={`cc${p.change_pct < 0 ? " neg" : ""}`}>
              {fmtPct(p.change_pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CarteraPopover;
