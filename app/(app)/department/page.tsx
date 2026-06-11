import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDepartmentKPIs, getDepartmentMembers } from "@/lib/queries";
import { currentPeriod, formatKPIValue, formatPeriod } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DepartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const user = await getCurrentUser();
  requireRole(user, ["admin", "manager"]);

  const supabase = await createClient();
  const period = currentPeriod();

  const params = await searchParams;
  let departmentId = params.dept ?? user.department_id;

  if (user.role === "manager") {
    departmentId = user.department_id;
  }

  if (!departmentId) {
    if (user.role === "admin") {
      const { data: departments } = await supabase.from("departments").select("*").order("name");
      if (departments && departments.length > 0) {
        redirect(`/department?dept=${departments[0].id}`);
      }
    }
    return <p className="text-sm text-text-secondary">No department assigned.</p>;
  }

  const [{ data: department }, kpis, members, { data: departments }] = await Promise.all([
    supabase.from("departments").select("*").eq("id", departmentId).single(),
    getDepartmentKPIs(supabase, departmentId, period),
    getDepartmentMembers(supabase, departmentId, period),
    user.role === "admin"
      ? supabase.from("departments").select("*").order("name")
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {department?.name ?? "Department"} Dashboard
          </h1>
          <p className="text-sm text-text-secondary">{formatPeriod(period)}</p>
        </div>

        {user.role === "admin" && departments && (
          <div className="flex gap-2">
            {departments.map((d) => (
              <a
                key={d.id}
                href={`/department?dept=${d.id}`}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  d.id === departmentId
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {d.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {members.map((m) => (
              <div key={m.user.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-text-primary">{m.user.full_name}</span>
                <span className="flex items-center gap-2 text-sm text-text-secondary">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: m.submitted ? "#3FB950" : "#D29922" }}
                  />
                  {m.submitted ? "Submitted" : "Not yet submitted"}
                </span>
              </div>
            ))}
            {members.length === 0 && (
              <p className="py-2.5 text-sm text-text-secondary">No team members.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPI Scores</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="rounded-md border border-border bg-bg-elevated p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{kpi.name}</p>
                  <StatusBadge band={kpi.band} />
                </div>
                <div className="flex items-center justify-between text-sm tabular-nums text-text-secondary">
                  <span>Target: {formatKPIValue(Number(kpi.target_value), kpi.data_type)}</span>
                  <span>
                    Actual:{" "}
                    {kpi.submission
                      ? formatKPIValue(Number(kpi.submission.actual_value ?? 0), kpi.data_type)
                      : "—"}
                  </span>
                </div>
                <ProgressBar score={kpi.score} band={kpi.band} className="mt-2" />
              </div>
            ))}
            {kpis.length === 0 && (
              <p className="text-sm text-text-secondary">No KPIs for this period.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
