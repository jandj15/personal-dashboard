"use client";

import { useCallback, useState } from "react";
import type { Priority, SettingsRow, TaskRow } from "@/lib/types";
import { todayInTz } from "@/lib/dates";

interface Props {
  tasks: TaskRow[];
  settings: SettingsRow;
}

const PRI_LABEL: Record<Priority, string> = {
  urgent: "URG",
  important: "IMP",
  normal: "NOR",
};

export default function TasksCard({ tasks }: Props) {
  // Optimistic set of ids just marked done (the next poll/refetch will catch up).
  const [doneNow, setDoneNow] = useState<Set<string>>(new Set());

  const isDone = useCallback(
    (t: TaskRow) => t.done || doneNow.has(t.id),
    [doneNow]
  );

  const toggle = useCallback(async (t: TaskRow) => {
    if (t.done || doneNow.has(t.id)) return; // checking off is one-way from the UI
    setDoneNow((s) => new Set(s).add(t.id));
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", id: t.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert on failure
      setDoneNow((s) => {
        const n = new Set(s);
        n.delete(t.id);
        return n;
      });
    }
  }, [doneNow]);

  const open = tasks.filter((t) => !isDone(t));
  const count = (p: Priority) => open.filter((t) => t.priority === p).length;

  const featured = tasks
    .filter((t) => t.featured && !isDone(t))
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 5);

  const today = todayInTz();
  const completedToday = tasks.filter(
    (t) =>
      doneNow.has(t.id) ||
      (t.done && t.completed_at && todayInTz(new Date(t.completed_at)) === today)
  ).length;
  const dayTotal = open.length + completedToday;

  return (
    <section className="card" data-cat="tasks" style={{ gridArea: "tasks" }}>
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Tareas <span className="num">· top 5</span>
        </div>
        <div className="task-summary">
          <span>
            <b>{count("urgent")}</b> URG
          </span>
          <span>
            <b>{count("important")}</b> IMP
          </span>
          <span>
            <b>{count("normal")}</b> NOR
          </span>
        </div>
      </div>

      <div className="task-list">
        {featured.map((t) => (
          <div className="task" data-pri={t.priority} key={t.id}>
            <button
              className="check"
              type="button"
              onClick={() => toggle(t)}
              aria-label={`Marcar "${t.title}" como hecha`}
              title="Marcar como hecha"
            ></button>
            <div className="body">
              <div className="title">{t.title}</div>
              <div className="meta">
                {t.tag} · <span className="due">{t.due_label}</span>
              </div>
            </div>
            <div className="pri">{PRI_LABEL[t.priority]}</div>
          </div>
        ))}
        {featured.length === 0 && (
          <div className="ev-empty">Sin tareas pendientes</div>
        )}
      </div>

      <div className="footline" style={{ marginTop: 0 }}>
        <span>
          COMPLETADAS HOY · <b style={{ color: "var(--fg)" }}>{completedToday}</b>/
          <b>{dayTotal}</b>
        </span>
        <span>VER TODAS →</span>
      </div>
    </section>
  );
}
