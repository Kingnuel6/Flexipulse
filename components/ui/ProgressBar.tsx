import { ScoreBand } from "@/types";
import { bandColor } from "@/lib/utils";

export function ProgressBar({
  score,
  band,
  className,
}: {
  score: number;
  band: ScoreBand;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={`h-1.5 w-full rounded-full bg-bg-elevated ${className ?? ""}`}>
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: bandColor(band) }}
      />
    </div>
  );
}
