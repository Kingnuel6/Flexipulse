import { ScoreBand } from "@/types";

// Returns a score from 0–100
export function scoreKPI(actual: number, target: number): number {
  if (target === 0) return 100;
  const ratio = actual / target;
  if (ratio >= 1) return 100;
  if (ratio >= 0.8) return Math.round(ratio * 100);
  return 0;
}

// Score band from numeric score
export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "healthy";
  if (score >= 60) return "watch";
  return "critical";
}

// Department score = average of all individual KPI scores in that department
export function departmentScore(kpiScores: number[]): number {
  if (kpiScores.length === 0) return 0;
  return Math.round(
    kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length
  );
}

// Company health score = average of all department scores (equal weights, MVP)
export function companyHealthScore(deptScores: number[]): number {
  if (deptScores.length === 0) return 0;
  return Math.round(
    deptScores.reduce((a, b) => a + b, 0) / deptScores.length
  );
}
