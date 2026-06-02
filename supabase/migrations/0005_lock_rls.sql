-- Lock down RLS for open-source release.
-- Single-user app. All data access now goes through cookie-gated server routes
-- using the SERVICE-ROLE key (which bypasses RLS). The anon key must read/write
-- NOTHING. RLS stays ENABLED on every table; we drop the permissive policies so
-- no policy grants anon any access (Postgres then default-denies).
--
-- Apply AFTER deploying the code that reads/writes via the server (/api/data,
-- /api/meals, /api/tasks) — applying it before the deploy would break the live
-- dashboard's (old) browser anon reads.

-- 1. Drop public read policies (from 0001 + 0002).
do $$
declare t text;
begin
  foreach t in array array[
    'settings','events','tasks','inbox','meals','nutrition','movement',
    'portfolio','portfolio_positions','time_blocks','time_summary','nutrition_log'
  ]
  loop
    execute format('drop policy if exists %I on public.%I;', t || '_read', t);
  end loop;
end $$;

-- 2. Drop public write policies (meals_write from 0001, tasks_write from 0004).
drop policy if exists meals_write on public.meals;
drop policy if exists tasks_write on public.tasks;

-- 3. Ensure RLS stays enabled (service-role bypasses it; anon now hits no policy).
do $$
declare t text;
begin
  foreach t in array array[
    'settings','events','tasks','inbox','meals','nutrition','movement',
    'portfolio','portfolio_positions','time_blocks','time_summary','nutrition_log','sync_state'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- 4. Remove tables from the Realtime publication — the client no longer uses
--    Realtime (it refetches via /api/data). Harmless if not published.
do $$
declare t text;
begin
  foreach t in array array[
    'settings','events','tasks','inbox','meals','nutrition','movement',
    'portfolio','portfolio_positions','time_blocks','time_summary','nutrition_log'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime drop table public.%I;', t);
    exception when others then null; -- not published / publication absent
    end;
  end loop;
end $$;
