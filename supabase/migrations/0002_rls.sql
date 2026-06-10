-- FlexiPulse: Row Level Security

alter table departments enable row level security;
alter table users enable row level security;
alter table kpis enable row level security;
alter table submissions enable row level security;

-- Helper functions (security definer to avoid recursive RLS lookups on `users`)

create or replace function auth_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

create or replace function auth_department_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select department_id from users where id = auth.uid();
$$;

-- ============================================================
-- departments
-- ============================================================

-- Admins can see all departments. Managers/employees can see their own.
create policy "departments_select" on departments
  for select
  using (
    auth_role() = 'admin'
    or id = auth_department_id()
  );

create policy "departments_insert" on departments
  for insert
  with check (auth_role() = 'admin');

create policy "departments_update" on departments
  for update
  using (auth_role() = 'admin');

create policy "departments_delete" on departments
  for delete
  using (auth_role() = 'admin');

-- ============================================================
-- users
-- ============================================================

-- Admins see everyone. Managers see their department. Employees see only themselves.
create policy "users_select" on users
  for select
  using (
    auth_role() = 'admin'
    or id = auth.uid()
    or (auth_role() = 'manager' and department_id = auth_department_id())
  );

create policy "users_insert" on users
  for insert
  with check (auth_role() = 'admin');

create policy "users_update" on users
  for update
  using (auth_role() = 'admin' or id = auth.uid());

create policy "users_delete" on users
  for delete
  using (auth_role() = 'admin');

-- ============================================================
-- kpis
-- ============================================================

-- Admins see all. Managers see KPIs in their department. Employees see KPIs assigned to them.
create policy "kpis_select" on kpis
  for select
  using (
    auth_role() = 'admin'
    or (auth_role() = 'manager' and department_id = auth_department_id())
    or assigned_to = auth.uid()
  );

create policy "kpis_insert" on kpis
  for insert
  with check (auth_role() = 'admin');

create policy "kpis_update" on kpis
  for update
  using (auth_role() = 'admin');

create policy "kpis_delete" on kpis
  for delete
  using (auth_role() = 'admin');

-- ============================================================
-- submissions
-- ============================================================

-- Admins see all. Managers see submissions from users in their department.
-- Employees see only their own submissions.
create policy "submissions_select" on submissions
  for select
  using (
    auth_role() = 'admin'
    or user_id = auth.uid()
    or (
      auth_role() = 'manager'
      and exists (
        select 1 from users u
        where u.id = submissions.user_id
        and u.department_id = auth_department_id()
      )
    )
  );

-- Users can only insert/update their own submissions (idempotent upsert handled at app layer).
create policy "submissions_insert" on submissions
  for insert
  with check (user_id = auth.uid());

create policy "submissions_update" on submissions
  for update
  using (user_id = auth.uid());

create policy "submissions_delete" on submissions
  for delete
  using (auth_role() = 'admin');
