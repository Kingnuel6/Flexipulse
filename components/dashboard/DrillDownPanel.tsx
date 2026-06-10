"use client";

import { X } from "lucide-react";
import { DrillDownData } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";
import { formatKPIValue } from "@/lib/utils";

interface DrillDownPanelProps {
  open: boolean;
  loading: boolean;
  data: DrillDownData | null;
  onClose: () => void;
}

export function DrillDownPanel({ open, loading, data, onClose }: DrillDownPanelProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-[320px] overflow-y-auto border-l border-border bg-bg-surface transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-surface px-4 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {data?.department.name ?? "Department"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          {loading && <p className="text-sm text-text-secondary">Loading...</p>}

          {!loading && data && (
            <div className="flex flex-col gap-5">
              {data.submissionRate < 100 && (
                <div className="rounded-md border border-status-amber/30 bg-status-amber/10 px-3 py-2 text-sm text-status-amber">
                  Score based on {data.submittedCount} of {data.totalCount} submissions
                </div>
              )}

              {data.biggestMiss && (
                <div>
                  <p className="label-text mb-2 text-text-secondary">Biggest Miss</p>
                  <div className="rounded-md border border-border bg-bg-elevated p-3">
                    <p className="mb-1 text-sm font-medium text-text-primary">
                      {data.biggestMiss.name}
                    </p>
                    <div className="flex items-center justify-between text-sm tabular-nums text-text-secondary">
                      <span>
                        Target: {formatKPIValue(Number(data.biggestMiss.target_value), data.biggestMiss.data_type)}
                      </span>
                      <span>
                        Actual:{" "}
                        {formatKPIValue(
                          Number(data.biggestMiss.submission?.actual_value ?? 0),
                          data.biggestMiss.data_type
                        )}
                      </span>
                    </div>
                    <ProgressBar
                      score={data.biggestMiss.score}
                      band={data.biggestMiss.band}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="label-text mb-2 text-text-secondary">All KPIs</p>
                <div className="flex flex-col gap-3">
                  {data.kpis.map((kpi) => (
                    <div
                      key={kpi.id}
                      className="rounded-md border border-border bg-bg-elevated p-3"
                    >
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
