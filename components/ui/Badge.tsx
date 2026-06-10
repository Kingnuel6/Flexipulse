import { ScoreBand } from "@/types";
import { bandLabel } from "@/lib/utils";
import { cn } from "@/components/ui/cn";

const bandStyles: Record<ScoreBand, string> = {
  healthy: "bg-status-green/15 text-status-green border-status-green/30",
  watch: "bg-status-amber/15 text-status-amber border-status-amber/30",
  critical: "bg-status-red/15 text-status-red border-status-red/30",
};

export function StatusBadge({ band, className }: { band: ScoreBand; className?: string }) {
  return (
    <span
      className={cn(
        "label-text inline-flex items-center rounded-full border px-2 py-0.5 font-medium",
        bandStyles[band],
        className
      )}
    >
      {bandLabel(band)}
    </span>
  );
}
