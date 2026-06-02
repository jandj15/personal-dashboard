import type { DashboardData } from "./types";

// Canonical fallback dataset — mirrors the design mockup's filled values and
// supabase/seed.sql. Used when Supabase env vars are absent so the dashboard
// renders identically to the prototype out of the box (local dev / first deploy).

export const defaultData: DashboardData = {
  settings: {
    id: "default",
    owner_name: "A. Romero",
    week_number: 17,
    sync_label: "hace 2 min",
    inbox_unread_total: 23,
    tasks_completed_today: 3,
    tasks_day_total: 8,
  },

  events: [
    // Today (offset 0) — the four events shown in "today" list
    { id: "e1", title: "Stand-up equipo producto", type: "meeting", day_offset: 0, start_time: "09:30", end_time: "09:45", location: "sala Meet-B", is_next: false, sort_order: 1 },
    { id: "e2", title: "Bloque de foco · documento estrategia", type: "focus", day_offset: 0, start_time: "10:15", end_time: "11:00", location: null, is_next: false, sort_order: 2 },
    { id: "e3", title: "Revisión trimestral · cliente Aurora", type: "meeting", day_offset: 0, start_time: "11:00", end_time: "11:45", location: "sala Meet-A", is_next: true, sort_order: 3 },
    { id: "e4", title: "Cita médica · revisión anual", type: "personal", day_offset: 0, start_time: "18:30", end_time: "19:15", location: null, is_next: false, sort_order: 4 },
    // Future days — only used to render the calendar dots
    { id: "e5", title: "Reunión cliente", type: "meeting", day_offset: 1, start_time: "10:00", end_time: "10:30", location: null, is_next: false, sort_order: 5 },
    { id: "e6", title: "Sesión foco", type: "focus", day_offset: 1, start_time: "15:00", end_time: "16:30", location: null, is_next: false, sort_order: 6 },
    { id: "e7", title: "Llamada proveedor", type: "meeting", day_offset: 2, start_time: "09:30", end_time: "10:00", location: null, is_next: false, sort_order: 7 },
    { id: "e8", title: "Revisión diseño", type: "focus", day_offset: 2, start_time: "12:00", end_time: "13:00", location: null, is_next: false, sort_order: 8 },
    { id: "e9", title: "Cena equipo", type: "personal", day_offset: 2, start_time: "21:00", end_time: null, location: "Bar Casa Lola", is_next: false, sort_order: 9 },
    { id: "e10", title: "Brunch familia", type: "personal", day_offset: 3, start_time: "11:30", end_time: null, location: null, is_next: false, sort_order: 10 },
  ],

  tasks: [
    { id: "t1", title: "Enviar propuesta comercial a Aurora", tag: "PROY", priority: "urgent", due_label: "vence hoy 17:00", done: false, featured: true, sort_order: 1 },
    { id: "t2", title: "Revisar contrato Q2 · cláusulas 4–7", tag: "LEGAL", priority: "urgent", due_label: "vence en 6h", done: false, featured: true, sort_order: 2 },
    { id: "t3", title: "Preparar presentación junta directiva", tag: "EJEC", priority: "important", due_label: "vence mañana", done: false, featured: true, sort_order: 3 },
    { id: "t4", title: "Feedback diseño v3 · onboarding", tag: "DISEÑO", priority: "important", due_label: "vence vie", done: false, featured: true, sort_order: 4 },
    { id: "t5", title: "Actualizar inventario libros leídos", tag: "PERS", priority: "normal", due_label: "sin fecha", done: false, featured: true, sort_order: 5 },
    // Remaining open tasks (feed the summary counts: 2 URG · 4 IMP · 5 NOR = 11)
    { id: "t6", title: "Responder correos pendientes", tag: "ADMIN", priority: "important", due_label: "vence hoy", done: false, featured: false, sort_order: 6 },
    { id: "t7", title: "Planificar sprint Q2", tag: "PROY", priority: "important", due_label: "vence jue", done: false, featured: false, sort_order: 7 },
    { id: "t8", title: "Comprar regalo cumpleaños", tag: "PERS", priority: "normal", due_label: "sin fecha", done: false, featured: false, sort_order: 8 },
    { id: "t9", title: "Renovar suscripción gimnasio", tag: "PERS", priority: "normal", due_label: "vence lun", done: false, featured: false, sort_order: 9 },
    { id: "t10", title: "Leer informe del sector", tag: "INV", priority: "normal", due_label: "sin fecha", done: false, featured: false, sort_order: 10 },
    { id: "t11", title: "Organizar archivos del proyecto", tag: "ADMIN", priority: "normal", due_label: "sin fecha", done: false, featured: false, sort_order: 11 },
  ],

  inbox: [
    { id: "m1", from_name: "Laura Méndez", initials: "LM", subject: "Re: revisión propuesta Aurora · feedback", preview: "Hola, he revisado el documento y tengo dos comentarios sobre la sección de presupuesto…", when_label: "hace 18m", replyable: true, sort_order: 1 },
    { id: "m2", from_name: "Javier Ruiz", initials: "JR", subject: "Propuesta de reunión semana 18", preview: "¿Podríamos confirmar el horario para el martes a las 16:00? Tengo flexibilidad…", when_label: "hace 2h", replyable: true, sort_order: 2 },
    { id: "m3", from_name: "Indexa Capital", initials: "IB", subject: "Resumen mensual · cartera abril", preview: "Informe automático con la evolución de tu cartera durante el mes de abril…", when_label: "hace 5h", replyable: false, sort_order: 3 },
    { id: "m4", from_name: "Calendar", initials: "CA", subject: "Invitación: cena equipo · vie 24 abr", preview: "Marta te ha invitado a un evento el viernes 24 a las 21:00 en Bar Casa Lola…", when_label: "ayer", replyable: false, sort_order: 4 },
  ],

  meals: [
    { id: "ml1", meal_type: "Desayuno", name: "Avena, plátano y café", kcal: 420, sort_order: 1 },
    { id: "ml2", meal_type: "Almuerzo", name: "Yogur griego y nueces", kcal: 260, sort_order: 2 },
    { id: "ml3", meal_type: "Comida", name: "Salmón, arroz y ensalada", kcal: 720, sort_order: 3 },
    { id: "ml4", meal_type: "Cena", name: "", kcal: 0, sort_order: 4 },
  ],

  nutrition: {
    id: "default",
    kcal_goal: 2200,
    protein_goal: 120,
    carbs_goal: 250,
    fat_goal: 70,
    water_goal_l: 2.0,
  },

  nutritionLog: {
    day: "default",
    protein_g: 96,
    carbs_g: 180,
    fat_g: 54,
    water_l: 1.4,
  },

  movement: {
    day: "default",
    move_kcal: 485,
    move_goal: 620,
    exercise_min: 28,
    exercise_goal: 30,
    stand_h: 8,
    stand_goal: 12,
    steps: 8420,
    distance_km: 6.2,
    resting_hr: 58,
    workouts: 1,
  },

  portfolio: {
    id: "default",
    total_eur: 184620.4,
    day_change_eur: 1247.3,
    day_change_pct: 0.68,
    // 17 sparkline y-values (viewBox 0..56, lower = higher value) — from the mockup path
    series_30d: [40, 38, 42, 34, 36, 30, 33, 26, 28, 22, 25, 18, 21, 14, 17, 10, 13],
  },

  positions: [
    { id: "p1", sym: "VWCE", name: "FTSE All-World", alloc_pct: 38, value_eur: 70156, change_pct: 1.12, sort_order: 1 },
    { id: "p2", sym: "AAPL", name: "Apple Inc.", alloc_pct: 14, value_eur: 25843, change_pct: -0.42, sort_order: 2 },
    { id: "p3", sym: "IWDA", name: "MSCI World", alloc_pct: 11, value_eur: 20308, change_pct: 0.84, sort_order: 3 },
  ],

  timeBlocks: [
    { id: "tb1", kind: "deep", label: "FOCO · 2h", flex: 2.0, sort_order: 1 },
    { id: "tb2", kind: "meet", label: "REU · 45m", flex: 1.0, sort_order: 2 },
    { id: "tb3", kind: "deep", label: "FOCO · 1h 25m", flex: 1.4, sort_order: 3 },
    { id: "tb4", kind: "break", label: "•", flex: 0.55, sort_order: 4 },
    { id: "tb5", kind: "meet", label: "REU · 1h 30m", flex: 1.5, sort_order: 5 },
    { id: "tb6", kind: "admin", label: "ADM", flex: 0.9, sort_order: 6 },
    { id: "tb7", kind: "free", label: "LIBRE · 1h 40m", flex: 1.6, sort_order: 7 },
    { id: "tb8", kind: "break", label: "•", flex: 0.55, sort_order: 8 },
    { id: "tb9", kind: "deep", label: "FOCO", flex: 1.3, sort_order: 9 },
  ],

  timeSummary: {
    id: "default",
    day_start: "08:00",
    day_end: "19:00",
    usage_pct: 82,
    focus_total: "4h 40m",
    meet_total: "2h 15m",
    admin_total: "1h 05m",
    break_total: "1h 20m",
    free_total: "1h 40m",
    focus_sub: "bloques sin interrupciones",
    meet_sub: "5 reuniones agendadas",
    admin_sub: "tareas ligeras y respuestas",
    break_sub: "comida y descansos cortos",
    free_sub: "sin compromisos · disponible para foco",
  },
};
