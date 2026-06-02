import type { SupabaseClient } from "@supabase/supabase-js";
import { todayInTz } from "./dates";

// Applies a Claude tool call to Supabase. Returns a short result string fed back
// to Claude (and used for the Telegram confirmation). Uses the service-role client.

async function nextOrder(sb: SupabaseClient, table: string): Promise<number> {
  const { data } = await sb
    .from(table)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number) ?? 0) + 1;
}

export async function nextMealOrder(sb: SupabaseClient, day: string): Promise<number> {
  const { data } = await sb
    .from("meals")
    .select("sort_order")
    .eq("logged_on", day)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number) ?? 0) + 1;
}

// Add macro grams to today's nutrition_log (read-modify-write so meals accumulate).
async function addMacros(
  sb: SupabaseClient,
  day: string,
  delta: { protein_g?: number; carbs_g?: number; fat_g?: number }
): Promise<void> {
  const { data } = await sb
    .from("nutrition_log")
    .select("protein_g,carbs_g,fat_g")
    .eq("day", day)
    .maybeSingle();
  const cur = data ?? { protein_g: 0, carbs_g: 0, fat_g: 0 };
  const { error } = await sb.from("nutrition_log").upsert(
    {
      day,
      protein_g: (cur.protein_g ?? 0) + (delta.protein_g ?? 0),
      carbs_g: (cur.carbs_g ?? 0) + (delta.carbs_g ?? 0),
      fat_g: (cur.fat_g ?? 0) + (delta.fat_g ?? 0),
    },
    { onConflict: "day" }
  );
  if (error) throw new Error(error.message);
}

export async function applyTool(
  sb: SupabaseClient,
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "add_task": {
      const sort_order = await nextOrder(sb, "tasks");
      const { error } = await sb.from("tasks").insert({
        title: String(input.title),
        tag: String(input.tag ?? ""),
        priority: String(input.priority ?? "normal"),
        due_label: String(input.due_label ?? "sin fecha"),
        featured: input.featured === undefined ? true : Boolean(input.featured),
        done: false,
        sort_order,
      });
      if (error) throw new Error(error.message);
      return `tarea añadida: ${input.title}`;
    }

    case "complete_task": {
      const q = String(input.title_query ?? "");
      const { data: match } = await sb
        .from("tasks")
        .select("id,title")
        .ilike("title", `%${q}%`)
        .eq("done", false)
        .limit(1)
        .maybeSingle();
      if (!match) return `no encontré una tarea que coincida con "${q}"`;
      const { error } = await sb
        .from("tasks")
        .update({ done: true, completed_at: new Date().toISOString() })
        .eq("id", match.id);
      if (error) throw new Error(error.message);
      return `tarea completada: ${match.title}`;
    }

    case "add_event": {
      const sort_order = await nextOrder(sb, "events");
      const { error } = await sb.from("events").insert({
        title: String(input.title),
        type: String(input.type),
        day_offset: Number(input.day_offset ?? 0),
        start_time: String(input.start_time),
        end_time: input.end_time ? String(input.end_time) : null,
        location: input.location ? String(input.location) : null,
        is_next: false,
        sort_order,
      });
      if (error) throw new Error(error.message);
      return `evento añadido: ${input.title}`;
    }

    case "log_meal": {
      const day = todayInTz();
      const sort_order = await nextMealOrder(sb, day);
      const { error } = await sb.from("meals").insert({
        meal_type: String(input.meal_type ?? "Extra"),
        name: String(input.name),
        kcal: Number(input.kcal ?? 0),
        sort_order,
        logged_on: day,
      });
      if (error) throw new Error(error.message);
      // Accumulate estimated macros into today's total.
      const p = Number(input.protein_g ?? 0);
      const c = Number(input.carbs_g ?? 0);
      const f = Number(input.fat_g ?? 0);
      if (p || c || f) await addMacros(sb, day, { protein_g: p, carbs_g: c, fat_g: f });
      return `comida registrada: ${input.name} (${input.kcal} kcal)`;
    }

    case "set_macros": {
      const day = todayInTz();
      const fields: Record<string, number> = {};
      for (const k of ["protein_g", "carbs_g", "fat_g"]) {
        if (input[k] !== undefined) fields[k] = Number(input[k]);
      }
      if (!Object.keys(fields).length) return "sin macros que actualizar";
      const { error } = await sb
        .from("nutrition_log")
        .upsert({ day, ...fields }, { onConflict: "day" });
      if (error) throw new Error(error.message);
      return `macros actualizados: ${Object.keys(fields).join(", ")}`;
    }

    case "set_water": {
      const day = todayInTz();
      const { error } = await sb
        .from("nutrition_log")
        .upsert({ day, water_l: Number(input.water_l) }, { onConflict: "day" });
      if (error) throw new Error(error.message);
      return `agua actualizada: ${input.water_l} L`;
    }

    case "update_movement": {
      const fields: Record<string, number> = {};
      for (const k of [
        "move_kcal", "exercise_min", "stand_h", "steps",
        "distance_km", "resting_hr", "workouts",
      ]) {
        if (input[k] !== undefined) fields[k] = Number(input[k]);
      }
      if (!Object.keys(fields).length) return "sin métricas que actualizar";
      const day = todayInTz();
      const { error } = await sb
        .from("movement")
        .upsert({ day, ...fields }, { onConflict: "day" });
      if (error) throw new Error(error.message);
      return `actividad actualizada: ${Object.keys(fields).join(", ")}`;
    }

    default:
      return `herramienta desconocida: ${name}`;
  }
}
