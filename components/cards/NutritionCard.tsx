"use client";

import { useEffect, useMemo, useState } from "react";
import type { MealRow, NutritionLogRow, NutritionRow } from "@/lib/types";
import { fmtInt } from "@/lib/format";

const postMeal = (body: Record<string, unknown>) =>
  fetch("/api/meals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

interface Props {
  initialMeals: MealRow[];
  nutrition: NutritionRow;
  log: NutritionLogRow;
}

export default function NutritionCard({ initialMeals, nutrition: n, log }: Props) {
  const [meals, setMeals] = useState<MealRow[]>(
    [...initialMeals].sort((a, b) => a.sort_order - b.sort_order)
  );

  // Resync when the meal set changes externally (e.g. the Telegram bot adds/removes
  // a meal). Keyed on the id-set so in-progress edits (same ids) aren't clobbered.
  const incomingIds = initialMeals.map((m) => m.id).sort().join(",");
  useEffect(() => {
    setMeals([...initialMeals].sort((a, b) => a.sort_order - b.sort_order));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingIds]);

  const consumed = useMemo(
    () => meals.reduce((sum, m) => sum + (m.kcal || 0), 0),
    [meals]
  );
  const logged = meals.filter((m) => m.name.trim() || m.kcal).length;
  const remaining = Math.max(0, n.kcal_goal - consumed);

  // macro bar widths (share of the calorie goal) + per-macro fills (vs goal)
  const pct = (v: number) => `${Math.min(100, (v / n.kcal_goal) * 100).toFixed(1)}%`;
  const segP = pct(log.protein_g * 4);
  const segC = pct(log.carbs_g * 4);
  const segF = pct(log.fat_g * 9);
  const fill = (v: number, g: number) => `${Math.min(100, (v / g) * 100).toFixed(0)}%`;

  const patch = (id: string, fields: Partial<MealRow>) => {
    setMeals((cur) => cur.map((m) => (m.id === id ? { ...m, ...fields } : m)));
  };

  const persist = (id: string, fields: Partial<MealRow>) => {
    postMeal({ action: "update", id, fields }).catch(() => {});
  };

  const addMeal = async () => {
    try {
      const res = await postMeal({ action: "create" });
      const json = await res.json();
      if (res.ok && json?.meal) {
        setMeals((cur) => [...cur, json.meal as MealRow]);
        return;
      }
    } catch {
      /* fall through to a local-only row */
    }
    // No DB (or request failed): keep the logger usable in-memory.
    const sort_order = (meals[meals.length - 1]?.sort_order ?? 0) + 1;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}`;
    setMeals((cur) => [...cur, { id, meal_type: "Extra", name: "", kcal: 0, sort_order }]);
  };

  const delMeal = (id: string) => {
    setMeals((cur) => cur.filter((m) => m.id !== id));
    postMeal({ action: "delete", id }).catch(() => {});
  };

  return (
    <section
      className="card"
      data-cat="habits"
      style={{ gridArea: "nutr", "--accent": "oklch(0.74 0.14 150)" } as React.CSSProperties}
    >
      <div className="card-head">
        <div className="card-title">
          <span className="pill"></span> Nutrición <span className="num">· hoy</span>
        </div>
        <div className="card-actions">
          <span>
            OBJETIVO · <b style={{ color: "var(--fg)" }}>{fmtInt(n.kcal_goal)}</b> kcal
          </span>
        </div>
      </div>

      <div className="nutri-grid">
        <div className="nutri-left">
          <div className="nutri-cal">
            <span className="nc-big">{fmtInt(consumed)}</span>
            <span className="nc-goal">kcal consumidas</span>
            <span className="nc-rem">
              {fmtInt(remaining)} kcal
              <small>restantes</small>
            </span>
          </div>

          <div className="nutri-bar">
            <i className="seg-p" style={{ width: segP }}></i>
            <i className="seg-c" style={{ width: segC }}></i>
            <i className="seg-f" style={{ width: segF }}></i>
          </div>

          <div className="macros">
            <div className="macro p">
              <div className="mc-top">
                <span className="mc-name">
                  <i></i> Prot.
                </span>
                <span className="mc-g">{log.protein_g}g</span>
              </div>
              <div className="mc-track">
                <div className="mc-fill" style={{ width: fill(log.protein_g, n.protein_goal) }}></div>
              </div>
              <span className="mc-goal">/ {n.protein_goal}g</span>
            </div>
            <div className="macro c">
              <div className="mc-top">
                <span className="mc-name">
                  <i></i> Carbs
                </span>
                <span className="mc-g">{log.carbs_g}g</span>
              </div>
              <div className="mc-track">
                <div className="mc-fill" style={{ width: fill(log.carbs_g, n.carbs_goal) }}></div>
              </div>
              <span className="mc-goal">/ {n.carbs_goal}g</span>
            </div>
            <div className="macro f">
              <div className="mc-top">
                <span className="mc-name">
                  <i></i> Grasas
                </span>
                <span className="mc-g">{log.fat_g}g</span>
              </div>
              <div className="mc-track">
                <div className="mc-fill" style={{ width: fill(log.fat_g, n.fat_goal) }}></div>
              </div>
              <span className="mc-goal">/ {n.fat_goal}g</span>
            </div>
          </div>

          <div className="nutri-chip water" style={{ marginTop: "auto" }}>
            <div className="nch-ic">◍</div>
            <div>
              <div className="nch-n">
                {log.water_l.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} /{" "}
                {n.water_goal_l.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
              </div>
              <div className="nch-l">Agua</div>
            </div>
          </div>
        </div>

        <div className="nutri-right">
          <div className="meals-head">
            <span>Comidas de hoy</span>
            <button className="meal-add" type="button" onClick={addMeal}>
              + Añadir
            </button>
          </div>

          <div className="meal-list">
            {meals.map((m) => (
              <div className="meal-row" key={m.id}>
                <span
                  className="meal-type"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const v = e.currentTarget.textContent?.trim() || "Extra";
                    patch(m.id, { meal_type: v });
                    persist(m.id, { meal_type: v });
                  }}
                >
                  {m.meal_type}
                </span>
                <input
                  className="meal-name"
                  type="text"
                  value={m.name}
                  placeholder="¿Qué comiste?"
                  onChange={(e) => patch(m.id, { name: e.target.value })}
                  onBlur={(e) => persist(m.id, { name: e.target.value })}
                />
                <input
                  className="meal-kcal"
                  type="number"
                  value={m.kcal ? String(m.kcal) : ""}
                  placeholder="kcal"
                  inputMode="numeric"
                  onChange={(e) => patch(m.id, { kcal: parseInt(e.target.value, 10) || 0 })}
                  onBlur={(e) => persist(m.id, { kcal: parseInt(e.target.value, 10) || 0 })}
                />
                <button
                  className="meal-del"
                  type="button"
                  title="Eliminar"
                  onClick={() => delMeal(m.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="meal-foot">
            <span>
              <b>{logged}</b> comidas registradas
            </span>
            <span>
              TOTAL · <b>{fmtInt(consumed)}</b> kcal
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
