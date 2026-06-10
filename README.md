# FlexiPulse — KPI Intelligence Platform

Internal MVP that gives leadership real-time visibility into organizational performance, with drill-down from company → department → individual.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth + Row-Level Security)
- Tailwind CSS, Recharts, Lucide React

## Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/migrations/0001_schema.sql` then `supabase/migrations/0002_rls.sql` against your project (SQL editor or `supabase db push`).
3. Run `supabase/seed.sql` to load development seed data (5 departments, 16 users, 6 months of KPI history). All seed users use the password `password123`.
   - Admin / CEO: `ceo@flexipulse.dev`
   - Department managers/employees: e.g. `tunde.bakare@flexipulse.dev` (Sales manager)
4. Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and keys.
5. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

## Scoring engine

All KPI scoring logic lives in `lib/scoring.ts`:

- `scoreKPI(actual, target)` — 0–100 score per KPI
- `scoreBand(score)` — `healthy` (80–100), `watch` (60–79), `critical` (0–59)
- `departmentScore(scores)` — average of KPI scores in a department
- `companyHealthScore(deptScores)` — average of department scores

## Roles

- **Admin (CEO)**: full visibility, executive dashboard, KPI/department setup
- **Manager**: department-scoped dashboard and submission visibility
- **Employee**: personal KPI submission form and dashboard

Access is enforced at the database layer via Postgres Row-Level Security (`supabase/migrations/0002_rls.sql`), not just the UI.
