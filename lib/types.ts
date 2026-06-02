// Row shapes — mirror supabase/migrations/0001_init.sql

export type EventType = "meeting" | "focus" | "personal";

export interface EventRow {
  id: string;
  title: string;
  type: EventType;
  /** 0 = today, -1 = yesterday, +1 = tomorrow … (kept relative so the demo is always populated) */
  day_offset: number;
  start_time: string; // "HH:MM"
  end_time: string | null; // "HH:MM"
  location: string | null;
  is_next: boolean; // flagged "próximo evento" highlight in the mockup
  sort_order: number;
}

export type Priority = "urgent" | "important" | "normal";

export interface TaskRow {
  id: string;
  title: string;
  tag: string;
  priority: Priority;
  due_label: string; // "vence hoy 17:00", "sin fecha", …
  done: boolean;
  featured: boolean; // shown in the top-5 list
  sort_order: number;
  completed_at?: string | null; // ISO timestamp when marked done
}

export interface InboxRow {
  id: string;
  from_name: string;
  initials: string;
  subject: string;
  preview: string;
  when_label: string; // "hace 18m", "ayer", …
  replyable: boolean;
  sort_order: number;
}

export interface MealRow {
  id: string;
  meal_type: string; // Desayuno / Almuerzo / Comida / Cena / Extra
  name: string;
  kcal: number;
  sort_order: number;
  logged_on?: string; // "YYYY-MM-DD" (APP_TZ day)
}

/** Constant nutrition goals (do not reset daily). */
export interface NutritionRow {
  id: string;
  kcal_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  water_goal_l: number;
}

/** Per-day consumed macros + water (resets daily). */
export interface NutritionLogRow {
  day: string; // "YYYY-MM-DD"
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_l: number;
}

/** Per-day activity (resets daily). Goal fields are constant targets. */
export interface MovementRow {
  day: string; // "YYYY-MM-DD"
  move_kcal: number;
  move_goal: number;
  exercise_min: number;
  exercise_goal: number;
  stand_h: number;
  stand_goal: number;
  steps: number;
  distance_km: number;
  resting_hr: number;
  workouts: number;
}

export interface PortfolioPosition {
  id: string;
  sym: string;
  name: string;
  alloc_pct: number;
  value_eur: number;
  change_pct: number;
  sort_order: number;
}

export interface PortfolioRow {
  id: string;
  total_eur: number;
  day_change_eur: number;
  day_change_pct: number;
  series_30d: number[]; // y-values for the sparkline (viewBox space)
}

export type TimeBlockKind = "deep" | "meet" | "admin" | "free" | "break";

export interface TimeBlockRow {
  id: string;
  kind: TimeBlockKind;
  label: string; // "FOCO · 2h", "•", …
  flex: number;
  sort_order: number;
}

export interface TimeSummaryRow {
  id: string;
  day_start: string; // "08:00"
  day_end: string; // "19:00"
  usage_pct: number;
  focus_total: string; // "4h 40m"
  meet_total: string;
  admin_total: string;
  break_total: string;
  free_total: string;
  focus_sub: string;
  meet_sub: string;
  admin_sub: string;
  break_sub: string;
  free_sub: string;
}

export interface SettingsRow {
  id: string;
  owner_name: string;
  week_number: number;
  sync_label: string;
  inbox_unread_total: number;
  tasks_completed_today: number;
  tasks_day_total: number;
}

export interface DashboardData {
  settings: SettingsRow;
  events: EventRow[];
  tasks: TaskRow[];
  inbox: InboxRow[];
  meals: MealRow[];
  nutrition: NutritionRow;
  nutritionLog: NutritionLogRow;
  movement: MovementRow;
  portfolio: PortfolioRow;
  positions: PortfolioPosition[];
  timeBlocks: TimeBlockRow[];
  timeSummary: TimeSummaryRow;
}
