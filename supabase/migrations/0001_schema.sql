-- FlexiPulse: Core schema

create extension if not exists pgcrypto;

-- departments
create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- users (mirrors auth.users, holds role + department)
create table if not exists users (
  id              uuid primary key references auth.users on delete cascade,
  full_name       text not null,
  role            text not null check (role in ('admin', 'manager', 'employee')),
  department_id   uuid references departments(id) on delete set null,
  created_at      timestamptz default now()
);

-- kpis
create table if not exists kpis (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  data_type       text not null check (data_type in ('number', 'currency', 'percentage', 'boolean')),
  target_value    numeric not null,
  department_id   uuid references departments(id) on delete cascade,
  assigned_to     uuid references users(id) on delete set null, -- null = department-level KPI
  period          text not null, -- e.g. '2026-06'
  created_at      timestamptz default now()
);

-- submissions
create table if not exists submissions (
  id              uuid primary key default gen_random_uuid(),
  kpi_id          uuid references kpis(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  actual_value    numeric,
  notes           text,
  submitted_at    timestamptz default now(),
  period          text not null,
  -- idempotent submissions: one row per user/kpi/period
  unique (kpi_id, user_id, period)
);

create index if not exists idx_kpis_department on kpis(department_id);
create index if not exists idx_kpis_assigned_to on kpis(assigned_to);
create index if not exists idx_kpis_period on kpis(period);
create index if not exists idx_submissions_kpi on submissions(kpi_id);
create index if not exists idx_submissions_user on submissions(user_id);
create index if not exists idx_submissions_period on submissions(period);
create index if not exists idx_users_department on users(department_id);
