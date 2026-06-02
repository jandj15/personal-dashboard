-- Seed data — mirrors lib/defaultData.ts and the design mockup.
-- Idempotent: clears the multi-row tables, upserts the single-row tables.

truncate table public.events, public.tasks, public.inbox, public.meals,
  public.portfolio_positions, public.time_blocks restart identity;

-- settings
insert into public.settings (id, owner_name, week_number, sync_label, inbox_unread_total, tasks_completed_today, tasks_day_total)
values ('default', 'A. Romero', 17, 'hace 2 min', 23, 3, 8)
on conflict (id) do update set
  owner_name = excluded.owner_name,
  week_number = excluded.week_number,
  sync_label = excluded.sync_label,
  inbox_unread_total = excluded.inbox_unread_total,
  tasks_completed_today = excluded.tasks_completed_today,
  tasks_day_total = excluded.tasks_day_total;

-- events (day_offset relative to today)
insert into public.events (title, type, day_offset, start_time, end_time, location, is_next, sort_order) values
  ('Stand-up equipo producto',                  'meeting',  0, '09:30', '09:45', 'sala Meet-B', false, 1),
  ('Bloque de foco · documento estrategia',     'focus',    0, '10:15', '11:00', null,          false, 2),
  ('Revisión trimestral · cliente Aurora',      'meeting',  0, '11:00', '11:45', 'sala Meet-A', true,  3),
  ('Cita médica · revisión anual',              'personal', 0, '18:30', '19:15', null,          false, 4),
  ('Reunión cliente',                            'meeting',  1, '10:00', '10:30', null,          false, 5),
  ('Sesión foco',                                'focus',    1, '15:00', '16:30', null,          false, 6),
  ('Llamada proveedor',                          'meeting',  2, '09:30', '10:00', null,          false, 7),
  ('Revisión diseño',                            'focus',    2, '12:00', '13:00', null,          false, 8),
  ('Cena equipo',                                'personal', 2, '21:00', null,    'Bar Casa Lola', false, 9),
  ('Brunch familia',                             'personal', 3, '11:30', null,    null,          false, 10);

-- tasks (5 featured + 6 more → 2 URG · 4 IMP · 5 NOR)
insert into public.tasks (title, tag, priority, due_label, done, featured, sort_order) values
  ('Enviar propuesta comercial a Aurora',     'PROY',   'urgent',    'vence hoy 17:00', false, true,  1),
  ('Revisar contrato Q2 · cláusulas 4–7',     'LEGAL',  'urgent',    'vence en 6h',     false, true,  2),
  ('Preparar presentación junta directiva',   'EJEC',   'important', 'vence mañana',    false, true,  3),
  ('Feedback diseño v3 · onboarding',         'DISEÑO', 'important', 'vence vie',       false, true,  4),
  ('Actualizar inventario libros leídos',     'PERS',   'normal',    'sin fecha',       false, true,  5),
  ('Responder correos pendientes',            'ADMIN',  'important', 'vence hoy',       false, false, 6),
  ('Planificar sprint Q2',                    'PROY',   'important', 'vence jue',       false, false, 7),
  ('Comprar regalo cumpleaños',               'PERS',   'normal',    'sin fecha',       false, false, 8),
  ('Renovar suscripción gimnasio',            'PERS',   'normal',    'vence lun',       false, false, 9),
  ('Leer informe del sector',                 'INV',    'normal',    'sin fecha',       false, false, 10),
  ('Organizar archivos del proyecto',         'ADMIN',  'normal',    'sin fecha',       false, false, 11);

-- inbox
insert into public.inbox (from_name, initials, subject, preview, when_label, replyable, sort_order) values
  ('Laura Méndez', 'LM', 'Re: revisión propuesta Aurora · feedback', 'Hola, he revisado el documento y tengo dos comentarios sobre la sección de presupuesto…', 'hace 18m', true,  1),
  ('Javier Ruiz',  'JR', 'Propuesta de reunión semana 18',           '¿Podríamos confirmar el horario para el martes a las 16:00? Tengo flexibilidad…',          'hace 2h',  true,  2),
  ('Indexa Capital','IB','Resumen mensual · cartera abril',          'Informe automático con la evolución de tu cartera durante el mes de abril…',               'hace 5h',  false, 3),
  ('Calendar',     'CA', 'Invitación: cena equipo · vie 24 abr',     'Marta te ha invitado a un evento el viernes 24 a las 21:00 en Bar Casa Lola…',             'ayer',     false, 4);

-- meals (sum = 1.400 kcal, 3 logged)
insert into public.meals (meal_type, name, kcal, sort_order) values
  ('Desayuno', 'Avena, plátano y café',     420, 1),
  ('Almuerzo', 'Yogur griego y nueces',     260, 2),
  ('Comida',   'Salmón, arroz y ensalada',  720, 3),
  ('Cena',     '',                            0, 4);

-- nutrition
insert into public.nutrition (id, kcal_goal, protein_g, protein_goal, carbs_g, carbs_goal, fat_g, fat_goal, water_l, water_goal_l)
values ('default', 2200, 96, 120, 180, 250, 54, 70, 1.4, 2.0)
on conflict (id) do update set
  kcal_goal = excluded.kcal_goal, protein_g = excluded.protein_g, protein_goal = excluded.protein_goal,
  carbs_g = excluded.carbs_g, carbs_goal = excluded.carbs_goal, fat_g = excluded.fat_g,
  fat_goal = excluded.fat_goal, water_l = excluded.water_l, water_goal_l = excluded.water_goal_l;

-- movement
insert into public.movement (id, move_kcal, move_goal, exercise_min, exercise_goal, stand_h, stand_goal, steps, distance_km, resting_hr, workouts)
values ('default', 485, 620, 28, 30, 8, 12, 8420, 6.2, 58, 1)
on conflict (id) do update set
  move_kcal = excluded.move_kcal, move_goal = excluded.move_goal, exercise_min = excluded.exercise_min,
  exercise_goal = excluded.exercise_goal, stand_h = excluded.stand_h, stand_goal = excluded.stand_goal,
  steps = excluded.steps, distance_km = excluded.distance_km, resting_hr = excluded.resting_hr, workouts = excluded.workouts;

-- portfolio
insert into public.portfolio (id, total_eur, day_change_eur, day_change_pct, series_30d)
values ('default', 184620.40, 1247.30, 0.68, '[40,38,42,34,36,30,33,26,28,22,25,18,21,14,17,10,13]'::jsonb)
on conflict (id) do update set
  total_eur = excluded.total_eur, day_change_eur = excluded.day_change_eur,
  day_change_pct = excluded.day_change_pct, series_30d = excluded.series_30d;

insert into public.portfolio_positions (sym, name, alloc_pct, value_eur, change_pct, sort_order) values
  ('VWCE', 'FTSE All-World', 38, 70156, 1.12,  1),
  ('AAPL', 'Apple Inc.',     14, 25843, -0.42, 2),
  ('IWDA', 'MSCI World',     11, 20308, 0.84,  3);

-- time blocks
insert into public.time_blocks (kind, label, flex, sort_order) values
  ('deep',  'FOCO · 2h',      2.0,  1),
  ('meet',  'REU · 45m',      1.0,  2),
  ('deep',  'FOCO · 1h 25m',  1.4,  3),
  ('break', '•',              0.55, 4),
  ('meet',  'REU · 1h 30m',   1.5,  5),
  ('admin', 'ADM',            0.9,  6),
  ('free',  'LIBRE · 1h 40m', 1.6,  7),
  ('break', '•',              0.55, 8),
  ('deep',  'FOCO',           1.3,  9);

-- time summary
insert into public.time_summary (id, day_start, day_end, usage_pct, focus_total, meet_total, admin_total, break_total, free_total, focus_sub, meet_sub, admin_sub, break_sub, free_sub)
values ('default', '08:00', '19:00', 82, '4h 40m', '2h 15m', '1h 05m', '1h 20m', '1h 40m',
  'bloques sin interrupciones', '5 reuniones agendadas', 'tareas ligeras y respuestas', 'comida y descansos cortos', 'sin compromisos · disponible para foco')
on conflict (id) do update set
  day_start = excluded.day_start, day_end = excluded.day_end, usage_pct = excluded.usage_pct,
  focus_total = excluded.focus_total, meet_total = excluded.meet_total, admin_total = excluded.admin_total,
  break_total = excluded.break_total, free_total = excluded.free_total,
  focus_sub = excluded.focus_sub, meet_sub = excluded.meet_sub, admin_sub = excluded.admin_sub,
  break_sub = excluded.break_sub, free_sub = excluded.free_sub;
