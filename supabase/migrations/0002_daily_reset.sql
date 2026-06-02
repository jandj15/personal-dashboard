-- Daily reset: scope meals, movement, and consumed macros/water to the day
-- (Europe/Madrid), so they reset at local midnight. Goals stay constant.

-- ---- meals: per-day ----
alter table public.meals add column if not exists logged_on date;
update public.meals set logged_on = (now() at time zone 'Europe/Madrid')::date where logged_on is null;
alter table public.meals alter column logged_on set default ((now() at time zone 'Europe/Madrid')::date);
alter table public.meals alter column logged_on set not null;
create index if not exists meals_logged_on_idx on public.meals (logged_on);

-- ---- movement: keyed by day; value cols default 0, goal cols keep constant targets ----
alter table public.movement add column if not exists day date;
update public.movement set day = (now() at time zone 'Europe/Madrid')::date where day is null;
alter table public.movement drop constraint if exists movement_pkey;
alter table public.movement drop column if exists id;
alter table public.movement alter column day set not null;
alter table public.movement alter column day set default ((now() at time zone 'Europe/Madrid')::date);
alter table public.movement add primary key (day);
alter table public.movement alter column move_kcal set default 0;
alter table public.movement alter column move_goal set default 620;
alter table public.movement alter column exercise_min set default 0;
alter table public.movement alter column exercise_goal set default 30;
alter table public.movement alter column stand_h set default 0;
alter table public.movement alter column stand_goal set default 12;
alter table public.movement alter column steps set default 0;
alter table public.movement alter column distance_km set default 0;
alter table public.movement alter column resting_hr set default 0;
alter table public.movement alter column workouts set default 0;

-- ---- nutrition stays as constant goals; consumed macros/water move to a daily log ----
create table if not exists public.nutrition_log (
  day date primary key default ((now() at time zone 'Europe/Madrid')::date),
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fat_g int not null default 0,
  water_l numeric not null default 0
);
insert into public.nutrition_log (day, protein_g, carbs_g, fat_g, water_l)
select (now() at time zone 'Europe/Madrid')::date,
       coalesce(protein_g, 0), coalesce(carbs_g, 0), coalesce(fat_g, 0), coalesce(water_l, 0)
from public.nutrition where id = 'default'
on conflict (day) do nothing;

alter table public.nutrition_log enable row level security;
drop policy if exists nutrition_log_read on public.nutrition_log;
create policy nutrition_log_read on public.nutrition_log for select using (true);
do $$ begin
  begin
    execute 'alter publication supabase_realtime add table public.nutrition_log';
  exception when duplicate_object then null;
  end;
end $$;
