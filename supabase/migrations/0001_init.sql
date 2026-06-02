-- Personal Dashboard — Phase 1 schema
-- Single-user app (gated by app password). RLS enabled with permissive policies:
-- public read for SSR/Realtime via anon key; the server uses the service-role key.
-- The browser only writes `meals` (the meal logger) in Phase 1.

create extension if not exists "pgcrypto";

-- ---------- settings (single row) ----------
create table if not exists public.settings (
  id text primary key default 'default',
  owner_name text not null,
  week_number int not null,
  sync_label text not null,
  inbox_unread_total int not null,
  tasks_completed_today int not null,
  tasks_day_total int not null
);

-- ---------- events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('meeting','focus','personal')),
  day_offset int not null default 0,
  start_time text not null,
  end_time text,
  location text,
  is_next boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null default '',
  priority text not null check (priority in ('urgent','important','normal')),
  due_label text not null default 'sin fecha',
  done boolean not null default false,
  featured boolean not null default false,
  sort_order int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- inbox ----------
create table if not exists public.inbox (
  id uuid primary key default gen_random_uuid(),
  from_name text not null,
  initials text not null,
  subject text not null,
  preview text not null default '',
  when_label text not null default '',
  replyable boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- meals (meal logger — browser writes this) ----------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  meal_type text not null default 'Extra',
  name text not null default '',
  kcal int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- nutrition (single row: consumed macros + goals + water) ----------
create table if not exists public.nutrition (
  id text primary key default 'default',
  kcal_goal int not null,
  protein_g int not null,
  protein_goal int not null,
  carbs_g int not null,
  carbs_goal int not null,
  fat_g int not null,
  fat_goal int not null,
  water_l numeric not null,
  water_goal_l numeric not null
);

-- ---------- movement (single row: today's activity) ----------
create table if not exists public.movement (
  id text primary key default 'default',
  move_kcal int not null,
  move_goal int not null,
  exercise_min int not null,
  exercise_goal int not null,
  stand_h int not null,
  stand_goal int not null,
  steps int not null,
  distance_km numeric not null,
  resting_hr int not null,
  workouts int not null
);

-- ---------- portfolio (single row) ----------
create table if not exists public.portfolio (
  id text primary key default 'default',
  total_eur numeric not null,
  day_change_eur numeric not null,
  day_change_pct numeric not null,
  series_30d jsonb not null default '[]'::jsonb
);

create table if not exists public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  sym text not null,
  name text not null,
  alloc_pct numeric not null,
  value_eur numeric not null,
  change_pct numeric not null,
  sort_order int not null default 0
);

-- ---------- time of day ----------
create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('deep','meet','admin','free','break')),
  label text not null,
  flex numeric not null,
  sort_order int not null default 0
);

create table if not exists public.time_summary (
  id text primary key default 'default',
  day_start text not null,
  day_end text not null,
  usage_pct int not null,
  focus_total text not null,
  meet_total text not null,
  admin_total text not null,
  break_total text not null,
  free_total text not null,
  focus_sub text not null,
  meet_sub text not null,
  admin_sub text not null,
  break_sub text not null,
  free_sub text not null
);

-- ---------- RLS ----------
alter table public.settings            enable row level security;
alter table public.events              enable row level security;
alter table public.tasks               enable row level security;
alter table public.inbox               enable row level security;
alter table public.meals               enable row level security;
alter table public.nutrition           enable row level security;
alter table public.movement            enable row level security;
alter table public.portfolio           enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.time_blocks         enable row level security;
alter table public.time_summary        enable row level security;

-- Public read everywhere (app already gated by password). Idempotent guards.
do $$
declare t text;
begin
  foreach t in array array[
    'settings','events','tasks','inbox','meals','nutrition','movement',
    'portfolio','portfolio_positions','time_blocks','time_summary'
  ]
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
    execute format('create policy %I on public.%I for select using (true);', t || '_read', t);
  end loop;
end $$;

-- Browser (anon) may fully manage the meal logger in Phase 1.
drop policy if exists meals_write on public.meals;
create policy meals_write on public.meals for all using (true) with check (true);

-- ---------- Realtime ----------
do $$
declare t text;
begin
  foreach t in array array[
    'settings','events','tasks','inbox','meals','nutrition','movement',
    'portfolio','portfolio_positions','time_blocks','time_summary'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
