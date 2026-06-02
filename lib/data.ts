import { getServerSupabase } from "./supabase/server";
import { defaultData } from "./defaultData";
import { todayInTz } from "./dates";
import { zeroLog, zeroMovement } from "./dailyDefaults";
import type { DashboardData, MovementRow, NutritionLogRow } from "./types";

/**
 * Load the dashboard dataset on the server. Daily data (meals, movement,
 * consumed macros/water) is scoped to today in APP_TZ and resets to empty/zero
 * at local midnight. Falls back to the bundled defaults only when Supabase is
 * unconfigured or a query fails.
 */
export async function loadDashboardData(): Promise<{
  data: DashboardData;
  source: "supabase" | "default";
}> {
  const sb = getServerSupabase();
  if (!sb) return { data: defaultData, source: "default" };

  const today = todayInTz();

  try {
    const [
      settings, events, tasks, inbox, meals, nutrition, nutritionLog,
      movement, portfolio, positions, timeBlocks, timeSummary,
    ] = await Promise.all([
      sb.from("settings").select("*").limit(1).maybeSingle(),
      sb.from("events").select("*").order("sort_order"),
      sb.from("tasks").select("*").order("sort_order"),
      sb.from("inbox").select("*").order("sort_order"),
      sb.from("meals").select("*").eq("logged_on", today).order("sort_order"),
      sb.from("nutrition").select("*").limit(1).maybeSingle(),
      sb.from("nutrition_log").select("*").eq("day", today).maybeSingle(),
      sb.from("movement").select("*").eq("day", today).maybeSingle(),
      sb.from("portfolio").select("*").limit(1).maybeSingle(),
      sb.from("portfolio_positions").select("*").order("sort_order"),
      sb.from("time_blocks").select("*").order("sort_order"),
      sb.from("time_summary").select("*").limit(1).maybeSingle(),
    ]);

    const anyError =
      settings.error || events.error || tasks.error || inbox.error ||
      meals.error || nutrition.error || nutritionLog.error || movement.error ||
      portfolio.error || positions.error || timeBlocks.error || timeSummary.error;
    if (anyError) return { data: defaultData, source: "default" };

    const data: DashboardData = {
      // seeded-once data: fall back to defaults if absent
      settings: settings.data ?? defaultData.settings,
      // events + inbox come from Google sync — empty is a real empty, not demo.
      events: events.data ?? defaultData.events,
      tasks: tasks.data?.length ? tasks.data : defaultData.tasks,
      inbox: inbox.data ?? defaultData.inbox,
      nutrition: nutrition.data ?? defaultData.nutrition,
      portfolio: portfolio.data ?? defaultData.portfolio,
      positions: positions.data?.length ? positions.data : defaultData.positions,
      timeBlocks: timeBlocks.data?.length ? timeBlocks.data : defaultData.timeBlocks,
      timeSummary: timeSummary.data ?? defaultData.timeSummary,
      // daily data: empty/zero when today has no rows (a real reset)
      meals: meals.data ?? [],
      nutritionLog: (nutritionLog.data as NutritionLogRow | null) ?? zeroLog(today),
      movement: (movement.data as MovementRow | null) ?? zeroMovement(today),
    };
    return { data, source: "supabase" };
  } catch {
    return { data: defaultData, source: "default" };
  }
}
