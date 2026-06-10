import { ScoreBand } from "@/types";

export function formatCurrency(value: number): string {
  return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatScore(value: number): string {
  return Math.round(value).toString();
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-NG");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Period format is 'YYYY-MM' -> 'June 2026'
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function bandColor(band: ScoreBand): string {
  switch (band) {
    case "healthy":
      return "#3FB950";
    case "watch":
      return "#D29922";
    case "critical":
      return "#F85149";
  }
}

export function bandLabel(band: ScoreBand): string {
  switch (band) {
    case "healthy":
      return "Healthy";
    case "watch":
      return "Watch";
    case "critical":
      return "Critical";
  }
}

export function formatKPIValue(
  value: number,
  dataType: "number" | "currency" | "percentage" | "boolean"
): string {
  switch (dataType) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return formatPercent(value);
    case "boolean":
      return value >= 1 ? "Yes" : "No";
    default:
      return formatNumber(value);
  }
}

// Returns current period in YYYY-MM format
export function currentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

// Returns the previous N periods (including current) in YYYY-MM format, most recent first
export function lastNPeriods(n: number, from?: string): string[] {
  const periods: string[] = [];
  let year: number, month: number;
  if (from) {
    const [y, m] = from.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }
  for (let i = 0; i < n; i++) {
    periods.push(`${year}-${month.toString().padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return periods;
}
