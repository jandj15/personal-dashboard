"use client";

import type { DashboardData } from "@/lib/types";
import { fmtLongDate, greetingWord } from "@/lib/format";

interface Props {
  data: DashboardData;
  now: Date | null;
}

export default function Greeting({ data, now }: Props) {
  const eventsToday = data.events.filter((e) => e.day_offset === 0).length;
  const openTasks = data.tasks.filter((t) => !t.done).length;
  const unread = data.settings.inbox_unread_total;

  return (
    <div className="greeting">
      <h1>
        {now ? greetingWord(now) : "Buenos días"}{" "}
        <span className="accent">
          — hoy es{" "}
          <span style={{ fontFamily: "var(--mono)", color: "var(--fg)" }} suppressHydrationWarning>
            {now ? fmtLongDate(now) : ""}
          </span>
        </span>
      </h1>
      <div className="meta">
        <b>{eventsToday}</b> EVENTOS · <b>{openTasks}</b> TAREAS ABIERTAS · <b>{unread}</b> SIN LEER
      </div>
    </div>
  );
}
