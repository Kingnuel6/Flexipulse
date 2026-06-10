import { ScoreBand } from "@/types";
import { bandColor } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  band?: ScoreBand;
}

export function MetricCard({ label, value, sublabel, band }: MetricCardProps) {
  return (
    <Card>
      <p className="label-text mb-2 text-text-secondary">{label}</p>
      <p
        className="tabular-nums text-3xl font-semibold leading-none"
        style={{ color: band ? bandColor(band) : "#E6EDF3" }}
      >
        {value}
      </p>
      {sublabel && <p className="mt-2 text-sm text-text-secondary">{sublabel}</p>}
    </Card>
  );
}
