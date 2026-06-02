"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData } from "@/lib/types";
import { todayInTz } from "@/lib/dates";
import TopBar from "./TopBar";
import Greeting from "./Greeting";
import CalendarCard from "./cards/CalendarCard";
import TasksCard from "./cards/TasksCard";
import InboxCard from "./cards/InboxCard";
import MovementCard from "./cards/MovementCard";
import NutritionCard from "./cards/NutritionCard";
import TimeBarCard from "./cards/TimeBarCard";

export default function Dashboard({
  initial,
  serverNow,
}: {
  initial: DashboardData;
  serverNow: number;
}) {
  const [data, setData] = useState<DashboardData>(initial);
  // Seed with the server clock (matches SSR), then tick on the client.
  const [now, setNow] = useState<Date>(() => new Date(serverNow));
  // Day shown in the calendar list + bottom timeline (0 = today).
  const [selectedOffset, setSelectedOffset] = useState(0);

  const appRef = useRef<HTMLDivElement>(null);

  // Scale the 1440px canvas to fill the viewport width, then size its height so the
  // grid stretches to fill the rest — full-bleed, no letterboxing.
  useEffect(() => {
    const fit = () => {
      const el = appRef.current;
      if (!el) return;
      const s = window.innerWidth / 1440;
      el.style.setProperty("--app-scale", String(s));
      el.style.height = `${window.innerHeight / s}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    const t = setTimeout(fit, 300); // refit after fonts settle
    return () => {
      window.removeEventListener("resize", fit);
      clearTimeout(t);
    };
  }, []);

  // Ticking clock (drives greeting, calendar countdown, time-bar marker)
  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Refetch the full dataset from the server (service-role, daily tables scoped to
  // today). The browser never touches Supabase directly — the anon key isn't shipped.
  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (!res.ok) return; // 401 (gate) / 503 (no DB) — keep current data
      const next = (await res.json()) as DashboardData;
      setData(next);
    } catch {
      /* offline — keep current data */
    }
  }, []);

  // Midnight rollover: when the local (APP_TZ) day changes, refetch so daily
  // cards reset on an already-open tab.
  useEffect(() => {
    let day = todayInTz();
    const id = setInterval(() => {
      const t = todayInTz();
      if (t !== day) {
        day = t;
        refetch();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [refetch]);

  // Refresh: poll periodically and refetch when the tab regains focus, so bot/Google
  // changes appear (e.g. after logging from Telegram and switching back to the dashboard).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refetch);
    const id = setInterval(refetch, 20_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refetch);
      clearInterval(id);
    };
  }, [refetch]);

  // Pull Google Calendar + Gmail into the DB. The server rate-limits (≤ every
  // 10 min), so triggering on mount/focus/interval is cheap; refetch surfaces it.
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        await fetch("/api/sync", { cache: "no-store" });
        if (!cancelled) refetch();
      } catch {
        /* offline / gated — ignore */
      }
    };
    sync();
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    const id = setInterval(sync, 5 * 60_000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, [refetch]);

  return (
    <div className="stage">
      <div className="app" ref={appRef} data-screen-label="01 D.A.V.I.D Dashboard">
      <TopBar settings={data.settings} />

      <Greeting data={data} now={now} />

      <div className="grid">
        <CalendarCard
          events={data.events}
          now={now}
          selectedOffset={selectedOffset}
          onSelectDay={setSelectedOffset}
        />
        <TasksCard tasks={data.tasks} settings={data.settings} />
        <InboxCard inbox={data.inbox} settings={data.settings} />
        <MovementCard movement={data.movement} />
        <NutritionCard initialMeals={data.meals} nutrition={data.nutrition} log={data.nutritionLog} />
        <TimeBarCard events={data.events} selectedOffset={selectedOffset} now={now} />
      </div>

      <div className="footline">
        <span>v2.4 · D.A.V.I.D · DASHBOARD</span>
        <span>↩ ATAJOS · ⌘K BUSCAR · ⌘, AJUSTES</span>
      </div>
      </div>
    </div>
  );
}
