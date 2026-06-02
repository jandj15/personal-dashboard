"use client";

import type { SettingsRow } from "@/lib/types";

interface Props {
  settings: SettingsRow;
}

export default function TopBar({ settings }: Props) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="dot"></span>
        <span className="crumb">D.A.V.I.D</span>
      </div>
      <div className="topbar-right">
        <span className="live">SINCRONIZADO · {settings.sync_label}</span>
        <span>
          SEM <b style={{ color: "var(--fg)" }}>{settings.week_number}</b>
        </span>
      </div>
    </div>
  );
}
