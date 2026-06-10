import { KPIWithSubmission } from "@/types";
import { Input, Label } from "@/components/ui/Input";

interface FormFieldProps {
  kpi: KPIWithSubmission;
  value: string;
  onChange: (value: string) => void;
}

export function FormField({ kpi, value, onChange }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={kpi.id}>
        {kpi.name}
        <span className="ml-2 normal-case text-text-muted">
          (Target: {kpi.data_type === "currency" ? "₦" : ""}
          {kpi.target_value}
          {kpi.data_type === "percentage" ? "%" : ""})
        </span>
      </Label>

      {kpi.data_type === "boolean" ? (
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            id={kpi.id}
            type="checkbox"
            checked={value === "1"}
            onChange={(e) => onChange(e.target.checked ? "1" : "0")}
            className="h-4 w-4 accent-accent"
          />
          Achieved
        </label>
      ) : (
        <div className="relative">
          {kpi.data_type === "currency" && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              ₦
            </span>
          )}
          <Input
            id={kpi.id}
            type="number"
            step="any"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={kpi.data_type === "currency" ? "pl-7" : kpi.data_type === "percentage" ? "pr-7" : ""}
            placeholder="0"
          />
          {kpi.data_type === "percentage" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
              %
            </span>
          )}
        </div>
      )}
    </div>
  );
}
