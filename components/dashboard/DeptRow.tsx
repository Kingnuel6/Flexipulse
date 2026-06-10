import { DepartmentScoreSummary } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/Badge";

interface DeptRowProps {
  summary: DepartmentScoreSummary;
  onClick?: () => void;
}

export function DeptRow({ summary, onClick }: DeptRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-md px-2 py-3 text-left transition-colors hover:bg-bg-elevated"
    >
      <span className="w-28 shrink-0 truncate text-sm font-medium text-text-primary">
        {summary.department.name}
      </span>
      <div className="flex-1">
        <ProgressBar score={summary.score} band={summary.band} />
      </div>
      <span className="tabular-nums w-10 shrink-0 text-right text-sm font-semibold text-text-primary">
        {summary.score}
      </span>
      <StatusBadge band={summary.band} className="shrink-0" />
    </button>
  );
}
