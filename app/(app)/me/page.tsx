import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserKPIs, getSubmissionHistory } from "@/lib/queries";
import { currentPeriod, lastNPeriods, formatPeriod, formatKPIValue } from "@/lib/utils";
import { scoreBand, departmentScore } from "@/lib/scoring";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";

export default async function MePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const period = currentPeriod();

  const kpis = await getUserKPIs(supabase, user.id, user.department_id, period);
  const overallScore = departmentScore(kpis.map((k) => k.score));
  const overallBand = scoreBand(overallScore);

  const historyPeriods = lastNPeriods(3, period);
  const history = await getSubmissionHistory(supabase, user.id, historyPeriods);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">My Dashboard</h1>
          <p className="text-sm text-text-secondary">{formatPeriod(period)}</p>
        </div>
        {kpis.length > 0 && <StatusBadge band={overallBand} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned KPIs — {formatPeriod(period)}</CardTitle>
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
            <p className="text-sm text-text-secondary">No KPIs assigned for this period.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <div className="flex flex-col divide-y divide-border">
          {history.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-text-primary">{s.kpi.name}</p>
                <p className="label-text text-text-muted">{formatPeriod(s.period)}</p>
              </div>
              <span className="tabular-nums text-sm text-text-secondary">
                {formatKPIValue(Number(s.actual_value ?? 0), s.kpi.data_type)} / target{" "}
                {formatKPIValue(Number(s.kpi.target_value), s.kpi.data_type)}
              </span>
            </div>
          ))}
          {history.length === 0 && (
            <p className="py-2.5 text-sm text-text-secondary">No submission history yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
