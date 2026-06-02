-- Allow the (single-user, password-gated) browser to manage tasks, so the
-- dashboard can check tasks off. Mirrors the meals_write policy.
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all using (true) with check (true);
