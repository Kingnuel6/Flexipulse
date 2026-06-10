"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { KPIWithSubmission } from "@/types";
import { FormField } from "@/components/forms/FormField";
import { Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPeriod } from "@/lib/utils";

interface KPIFormProps {
  initialKpis: KPIWithSubmission[];
  period: string;
}

export function KPIForm({ initialKpis, period }: KPIFormProps) {
  const [kpis] = useState(initialKpis);
  const [values, setValues] = useState<Record<string, string>>({});
  const [blockers, setBlockers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const kpi of kpis) {
      if (kpi.submission?.actual_value !== undefined && kpi.submission?.actual_value !== null) {
        initial[kpi.id] = String(kpi.submission.actual_value);
      } else {
        initial[kpi.id] = "";
      }
    }
    setValues(initial);
    if (kpis[0]?.submission?.notes) {
      setBlockers(kpis[0].submission.notes);
    }
  }, [kpis]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    const submissions = kpis.map((kpi) => ({
      kpi_id: kpi.id,
      actual_value: kpi.data_type === "boolean" ? Number(values[kpi.id] || "0") : Number(values[kpi.id] || "0"),
      notes: blockers || null,
      period,
    }));

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (kpis.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">
          You have no KPIs assigned for {formatPeriod(period)}.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {kpis.map((kpi) => (
          <FormField
            key={kpi.id}
            kpi={kpi}
            value={values[kpi.id] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [kpi.id]: v }))}
          />
        ))}

        <div>
          <Label htmlFor="blockers">Blockers (optional)</Label>
          <Textarea
            id="blockers"
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Anything blocking progress this period?"
          />
        </div>

        {error && <p className="text-sm text-status-red">{error}</p>}

        <Button type="submit" disabled={submitting} className="self-start">
          {submitted ? (
            <span className="flex items-center gap-1.5">
              <Check size={16} /> Submitted
            </span>
          ) : submitting ? (
            "Submitting..."
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Card>
  );
}
