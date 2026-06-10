# CLAUDE.md — KPI Intelligence Platform

This file is the single source of truth for building FlexiPulse, the KPI Intelligence Platform. Read it fully before writing any code.

\---

## What This Is

An internal KPI Intelligence Platform that gives companies real-time visibility into organizational performance across all levels — company, department, team, and individual.

Employees submit KPI data through structured forms. The system aggregates this into a unified executive dashboard. Leadership can drill down from company-level health scores into department → team → individual contributor performance in a few clicks.

**This is an MVP build. Stay within MVP scope.**

\---

## Tech Stack

|Layer|Choice|
|-|-|
|Frontend|Next.js 14 (App Router)|
|Backend / DB|Supabase (PostgreSQL + Auth + Row-Level Security)|
|Styling|Tailwind CSS|
|Charts|Recharts|
|Icons|Lucide React|
|Deployment|Vercel|

\---

## Design System

### Colors

```
Background base:     #0D1117
Background surface:  #161B22
Background elevated: #1C2128
Border:              #30363D
Text primary:        #E6EDF3
Text secondary:      #8B949E
Text muted:          #6E7681
Accent (indigo):     #6366F1
Accent dim:          #3730A3
Status green:        #3FB950
Status amber:        #D29922
Status red:          #F85149
```

### Score Bands

```
80–100  →  Green  →  "Healthy"
60–79   →  Amber  →  "Watch"
0–59    →  Red    →  "Critical"
```

### Typography

* Font: System UI stack (`system-ui, -apple-system, sans-serif`)
* All score/number values must use `font-variant-numeric: tabular-nums`
* Body: 14px / line-height 1.5
* Labels: 11px uppercase, letter-spacing 0.06em

### Layout

* Left sidebar nav (200px fixed width, collapsible on mobile)
* Main content area uses bento-grid card layout
* Drill-down opens as a slide-over panel from the right (320px), not a new page
* Max content width: 1200px

\---

## User Roles \& Access

Three roles. Enforce at Supabase row-level security (RLS) — not just UI-level.

### Admin (CEO / Executive)

* Full system visibility
* Access: all screens
* Can configure KPIs, departments, users

### Manager (Department Head)

* Department-scoped visibility only
* Access: their department's teams, KPI scores, submission status
* Cannot see other departments

### Employee

* Individual visibility only
* Access: their own KPI form and personal dashboard
* Cannot see team or department data

**RLS rule:** Every Supabase query must be scoped by `user\_id` or `department\_id` depending on role. No exceptions. Never trust the frontend for access control.

\---

## Database Schema

### `departments`

```sql
id          uuid PRIMARY KEY DEFAULT gen\_random\_uuid()
name        text NOT NULL
created\_at  timestamptz DEFAULT now()
```

### `users`

```sql
id              uuid PRIMARY KEY REFERENCES auth.users
full\_name       text NOT NULL
role            text CHECK (role IN ('admin', 'manager', 'employee'))
department\_id   uuid REFERENCES departments(id)
created\_at      timestamptz DEFAULT now()
```

### `kpis`

```sql
id              uuid PRIMARY KEY DEFAULT gen\_random\_uuid()
name            text NOT NULL
data\_type       text CHECK (data\_type IN ('number', 'currency', 'percentage', 'boolean'))
target\_value    numeric NOT NULL
department\_id   uuid REFERENCES departments(id)
assigned\_to     uuid REFERENCES users(id)   -- null = department-level KPI
period          text NOT NULL               -- e.g. '2026-06'
created\_at      timestamptz DEFAULT now()
```

### `submissions`

```sql
id              uuid PRIMARY KEY DEFAULT gen\_random\_uuid()
kpi\_id          uuid REFERENCES kpis(id)
user\_id         uuid REFERENCES users(id)
actual\_value    numeric
notes           text
submitted\_at    timestamptz DEFAULT now()
period          text NOT NULL
```

\---

## KPI Scoring Logic

Implement this in a shared utility file (`/lib/scoring.ts`).

```typescript
// Returns a score from 0–100
export function scoreKPI(actual: number, target: number): number {
  if (target === 0) return 100
  const ratio = actual / target
  if (ratio >= 1) return 100
  if (ratio >= 0.8) return Math.round(ratio \* 100)
  return 0
}

// Score band from numeric score
export function scoreBand(score: number): 'healthy' | 'watch' | 'critical' {
  if (score >= 80) return 'healthy'
  if (score >= 60) return 'watch'
  return 'critical'
}

// Department score = average of all individual KPI scores in that department
export function departmentScore(kpiScores: number\[]): number {
  if (kpiScores.length === 0) return 0
  return Math.round(kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length)
}

// Company health score = average of all department scores (equal weights, MVP)
export function companyHealthScore(deptScores: number\[]): number {
  if (deptScores.length === 0) return 0
  return Math.round(deptScores.reduce((a, b) => a + b, 0) / deptScores.length)
}
```

\---

## Application Screens

### 1\. Executive Dashboard (`/dashboard`)

Access: Admin only

**Top row — 4 metric cards:**

* Company Health Score (large number, color-coded by band)
* KPIs on target (e.g. "61% — 34 of 56")
* Departments in critical (count + names)
* Submission rate this period (e.g. "83% — 47 of 57 members")

**Main row — 2 cards:**

* Department ranking: sorted worst → best, each row shows name / progress bar / score / status badge. Every row is clickable → opens drill-down panel.
* 6-month trend chart: bar chart, bars colored by score band, months on x-axis.

**Drill-down panel (slide-over, 320px):**
Opens when exec clicks a department row. Shows:

1. Biggest miss — the KPI with the largest gap between target and actual
2. All KPIs for that department with target / actual / progress bar (color-coded)
3. If submission rate < 100%, show a warning: "Score based on X of Y submissions"

### 2\. Department Dashboard (`/department`)

Access: Manager + Admin

**Left card — Submission status:**
List of all team members with "Submitted" (green dot) or "Not yet submitted" (amber dot) status for the current period. No enforcement — visibility only.

**Right card — KPI scores:**
Each KPI as a card showing name, target, actual, progress bar. Color-coded by score.

### 3\. KPI Submission Form (`/submit`)

Access: Employee + Manager + Admin

Dynamically generated based on the user's assigned KPIs for the current period.

**Form fields by KPI data type:**

* `number` → standard number input
* `currency` → ₦-prefixed input (no currency conversion needed for MVP)
* `percentage` → number input with % label
* `boolean` → toggle / checkbox

Always include an optional "blockers" textarea at the bottom.

On submit:

1. Validate all required fields
2. Insert row into `submissions` table
3. Show loading state on button → success state ("✓ Submitted")
4. Do not redirect — let them review what they submitted

### 4\. Employee Dashboard (`/me`)

Access: Employee (own data only)

Shows:

* Assigned KPIs for current period
* Submission history (last 3 periods)
* Target vs actual for each KPI
* Personal score band badge

### 5\. Admin KPI Setup (`/admin/kpis`)

Access: Admin only

CRUD interface for:

* Creating departments
* Creating KPIs (name, data type, target, department, assigned user, period)
* Viewing all users and their roles

\---

## Navigation Structure

```
Sidebar nav:
  Overview
  ├── Executive (admin only)
  └── Departments

  My Work
  ├── Submit KPIs
  └── My Dashboard

  Admin
  └── KPI Settings (admin only)
```

Active state: indigo background tint + indigo text.
User avatar + name + role at sidebar bottom.

\---

## API Routes

Use Next.js Route Handlers (`/app/api/...`). All routes require authenticated session via Supabase Auth.

```
GET  /api/dashboard/summary        → company health score, dept scores, submission rate
GET  /api/dashboard/trend          → 6-month score history per department
GET  /api/department/:id/kpis      → KPI scores for a department
GET  /api/department/:id/members   → submission status per member
GET  /api/user/kpis                → current user's assigned KPIs
POST /api/submissions              → submit KPI data
GET  /api/submissions/history      → current user's past submissions
```

\---

## MVP Scope — Strict

### Include

* Supabase Auth (email + password, no OAuth for MVP)
* Role-based access (admin / manager / employee)
* KPI setup via admin panel
* Form-based KPI submissions
* Scoring engine (as defined above)
* Executive dashboard with drill-down
* Department dashboard with submission visibility
* Employee dashboard + submission form
* 6-month trend chart

### Exclude (next version)

* Submission deadlines or enforcement
* Automated reminders or notifications
* Predictive analytics
* External integrations
* AI-generated summaries (Phase 2)
* OAuth or SSO
* Mobile app

\---

## Environment Variables

```env
NEXT\_PUBLIC\_SUPABASE\_URL=
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=
SUPABASE\_SERVICE\_ROLE\_KEY=
```

\---

## Folder Structure

```
/app
  /dashboard          → Executive dashboard
  /department         → Department view
  /submit             → KPI submission form
  /me                 → Employee dashboard
  /admin
    /kpis             → KPI + department setup
  /api
    /dashboard/...
    /department/...
    /user/...
    /submissions/...
/components
  /ui                 → Reusable primitives (Card, Badge, Button, Input)
  /charts             → Recharts wrappers (TrendChart, BarGroup)
  /dashboard          → Dashboard-specific components (DrillDownPanel, DeptRow, MetricCard)
  /forms              → KPIForm, FormField
/lib
  /scoring.ts         → All scoring logic (scoreKPI, scoreBand, departmentScore, companyHealthScore)
  /supabase.ts        → Supabase client init
  /utils.ts           → Formatters (formatCurrency, formatPercent, formatScore)
/types
  index.ts            → All shared TypeScript types
```

\---

## Key Implementation Notes

1. **RLS first.** Set up Supabase RLS policies before building any UI. Never query without it.
2. **Scoring in `/lib/scoring.ts` only.** Never inline scoring logic in components. Import from the shared file.
3. **No client-side role checks as security.** Role-gated UI is fine for UX but the actual data must be protected at the database layer.
4. **Tabular numerals on all scores.** Use `font-variant-numeric: tabular-nums` on every number that updates dynamically.
5. **Drill-down is a panel, not a route.** The executive drill-down opens as a right-side slide-over. Use a local state boolean to control it. Do not navigate to a new URL.
6. **Currency is ₦ only.** No multi-currency, no conversion. Hard-code the ₦ symbol everywhere.
7. **Period format is `YYYY-MM`.** Store and display as `'2026-06'`. Format for display as `'June 2026'` using a utility function.
8. **Submission is idempotent.** If a user submits a KPI for a period they already submitted, update the existing row. Do not create duplicates.

\---

## Seed Data (for development)

Create a Supabase seed file with:

* 5 departments: Sales, Finance, Marketing, Operations, Logistics
* 3 users per department (1 manager, 2 employees)
* 3 KPIs per department
* 5 months of historical submissions with realistic variance
* 1 admin user (CEO)

This seed data must produce: 2 green departments, 1 amber, 2 red — matching the demo design.

\---

## Definition of Done (MVP)

* \[ ] All 5 screens render with real data from Supabase
* \[ ] Role-based access enforced at DB layer (RLS)
* \[ ] KPI scoring engine calculates correctly for all 4 data types
* \[ ] Executive drill-down navigates from company → department → KPI
* \[ ] Submission form saves to DB and shows success state
* \[ ] Seed data loads and produces correct score bands
* \[ ] Deploys to Vercel without errors

