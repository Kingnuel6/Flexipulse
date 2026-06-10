"use client";

import { useState } from "react";
import { Department, KPI, User, DataType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatKPIValue, formatPeriod } from "@/lib/utils";
import { cn } from "@/components/ui/cn";

type Tab = "departments" | "kpis" | "users";

interface AdminClientProps {
  initialDepartments: Department[];
  initialKpis: KPI[];
  users: User[];
  period: string;
}

export function AdminClient({ initialDepartments, initialKpis, users, period }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>("departments");
  const [departments, setDepartments] = useState(initialDepartments);
  const [kpis, setKpis] = useState(initialKpis);
  const supabase = createClient();

  // department form state
  const [deptName, setDeptName] = useState("");
  const [deptError, setDeptError] = useState<string | null>(null);

  // kpi form state
  const [kpiName, setKpiName] = useState("");
  const [kpiType, setKpiType] = useState<DataType>("number");
  const [kpiTarget, setKpiTarget] = useState("");
  const [kpiDept, setKpiDept] = useState(initialDepartments[0]?.id ?? "");
  const [kpiAssignee, setKpiAssignee] = useState("");
  const [kpiPeriod, setKpiPeriod] = useState(period);
  const [kpiError, setKpiError] = useState<string | null>(null);

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    setDeptError(null);
    if (!deptName.trim()) return;

    const { data, error } = await supabase
      .from("departments")
      .insert({ name: deptName.trim() })
      .select()
      .single();

    if (error) {
      setDeptError(error.message);
      return;
    }

    setDepartments((prev) => [...prev, data as Department].sort((a, b) => a.name.localeCompare(b.name)));
    setDeptName("");
  }

  async function handleAddKpi(e: React.FormEvent) {
    e.preventDefault();
    setKpiError(null);
    if (!kpiName.trim() || !kpiTarget || !kpiDept) return;

    const { data, error } = await supabase
      .from("kpis")
      .insert({
        name: kpiName.trim(),
        data_type: kpiType,
        target_value: Number(kpiTarget),
        department_id: kpiDept,
        assigned_to: kpiAssignee || null,
        period: kpiPeriod,
      })
      .select()
      .single();

    if (error) {
      setKpiError(error.message);
      return;
    }

    if (kpiPeriod === period) {
      setKpis((prev) => [...prev, data as KPI]);
    }
    setKpiName("");
    setKpiTarget("");
    setKpiAssignee("");
  }

  const departmentUsers = users.filter((u) => u.department_id === kpiDept);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">KPI Settings</h1>
        <p className="text-sm text-text-secondary">Manage departments, KPIs, and users</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["departments", "kpis", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "label-text px-3 py-2 capitalize transition-colors",
              tab === t
                ? "border-b-2 border-accent text-accent"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "departments" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Department</CardTitle>
            </CardHeader>
            <form onSubmit={handleAddDepartment} className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="deptName">Name</Label>
                <Input
                  id="deptName"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Customer Success"
                />
              </div>
              <Button type="submit">Add</Button>
            </form>
            {deptError && <p className="mt-2 text-sm text-status-red">{deptError}</p>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
            </CardHeader>
            <div className="flex flex-col divide-y divide-border">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 text-sm text-text-primary">
                  {d.name}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "kpis" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add KPI</CardTitle>
            </CardHeader>
            <form onSubmit={handleAddKpi} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="kpiName">Name</Label>
                <Input
                  id="kpiName"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  placeholder="e.g. Monthly Revenue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="kpiType">Data Type</Label>
                  <select
                    id="kpiType"
                    value={kpiType}
                    onChange={(e) => setKpiType(e.target.value as DataType)}
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="number">Number</option>
                    <option value="currency">Currency (₦)</option>
                    <option value="percentage">Percentage</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="kpiTarget">Target Value</Label>
                  <Input
                    id="kpiTarget"
                    type="number"
                    step="any"
                    value={kpiTarget}
                    onChange={(e) => setKpiTarget(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="kpiDept">Department</Label>
                  <select
                    id="kpiDept"
                    value={kpiDept}
                    onChange={(e) => {
                      setKpiDept(e.target.value);
                      setKpiAssignee("");
                    }}
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="kpiAssignee">Assigned To</Label>
                  <select
                    id="kpiAssignee"
                    value={kpiAssignee}
                    onChange={(e) => setKpiAssignee(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="">Department-level</option>
                    {departmentUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="kpiPeriod">Period</Label>
                <Input
                  id="kpiPeriod"
                  value={kpiPeriod}
                  onChange={(e) => setKpiPeriod(e.target.value)}
                  placeholder="2026-06"
                />
              </div>

              {kpiError && <p className="text-sm text-status-red">{kpiError}</p>}

              <Button type="submit" className="self-start">
                Add KPI
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>KPIs — {formatPeriod(period)}</CardTitle>
            </CardHeader>
            <div className="flex flex-col divide-y divide-border">
              {kpis.map((k) => {
                const dept = departments.find((d) => d.id === k.department_id);
                const assignee = users.find((u) => u.id === k.assigned_to);
                return (
                  <div key={k.id} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{k.name}</p>
                      <p className="tabular-nums text-sm text-text-secondary">
                        {formatKPIValue(Number(k.target_value), k.data_type)}
                      </p>
                    </div>
                    <p className="label-text text-text-muted">
                      {dept?.name ?? "—"} · {assignee?.full_name ?? "Department-level"}
                    </p>
                  </div>
                );
              })}
              {kpis.length === 0 && (
                <p className="py-2.5 text-sm text-text-secondary">No KPIs for this period.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <div className="flex flex-col divide-y divide-border">
            {users.map((u) => {
              const dept = departments.find((d) => d.id === u.department_id);
              return (
                <div key={u.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-text-primary">{u.full_name}</span>
                  <span className="flex items-center gap-3 text-sm text-text-secondary">
                    <span>{dept?.name ?? "—"}</span>
                    <span className="label-text rounded-full border border-border px-2 py-0.5 capitalize">
                      {u.role}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
