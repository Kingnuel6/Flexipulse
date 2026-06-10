"use client";

import { useState } from "react";
import { DashboardSummary, TrendPoint, DrillDownData } from "@/types";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DeptRow } from "@/components/dashboard/DeptRow";
import { DrillDownPanel } from "@/components/dashboard/DrillDownPanel";
import { TrendChart } from "@/components/charts/TrendChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatPeriod } from "@/lib/utils";

interface DashboardClientProps {
  summary: DashboardSummary;
  trend: TrendPoint[];
  period: string;
}

export function DashboardClient({ summary, trend, period }: DashboardClientProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [drilldown, setDrilldown] = useState<DrillDownData | null>(null);

  async function handleDeptClick(deptId: string) {
    setPanelOpen(true);
    setPanelLoading(true);
    try {
      const res = await fetch(`/api/department/${deptId}/drilldown?period=${period}`);
      const data = await res.json();
      setDrilldown(data);
    } finally {
      setPanelLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Executive Dashboard</h1>
        <p className="text-sm text-text-secondary">{formatPeriod(period)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Company Health Score"
          value={summary.companyHealthScore.toString()}
          band={summary.companyBand}
        />
        <MetricCard
          label="KPIs On Target"
          value={`${summary.kpisOnTarget.percent}%`}
          sublabel={`${summary.kpisOnTarget.count} of ${summary.kpisOnTarget.total}`}
        />
        <MetricCard
          label="Departments In Critical"
          value={summary.departmentsCritical.count.toString()}
          sublabel={summary.departmentsCritical.names.join(", ") || "None"}
          band={summary.departmentsCritical.count > 0 ? "critical" : "healthy"}
        />
        <MetricCard
          label="Submission Rate"
          value={`${summary.submissionRate.percent}%`}
          sublabel={`${summary.submissionRate.count} of ${summary.submissionRate.total} submissions`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Ranking</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {summary.departmentRanking.map((dept) => (
              <DeptRow
                key={dept.department.id}
                summary={dept}
                onClick={() => handleDeptClick(dept.department.id)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6-Month Trend</CardTitle>
          </CardHeader>
          <TrendChart points={trend} />
        </Card>
      </div>

      <DrillDownPanel
        open={panelOpen}
        loading={panelLoading}
        data={drilldown}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
