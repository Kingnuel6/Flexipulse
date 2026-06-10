export type Role = "admin" | "manager" | "employee";

export type DataType = "number" | "currency" | "percentage" | "boolean";

export type ScoreBand = "healthy" | "watch" | "critical";

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  created_at: string;
}

export interface KPI {
  id: string;
  name: string;
  data_type: DataType;
  target_value: number;
  department_id: string;
  assigned_to: string | null;
  period: string;
  created_at: string;
}

export interface Submission {
  id: string;
  kpi_id: string;
  user_id: string;
  actual_value: number | null;
  notes: string | null;
  submitted_at: string;
  period: string;
}

export interface KPIWithSubmission extends KPI {
  submission?: Submission | null;
  score: number;
  band: ScoreBand;
}

export interface DepartmentScoreSummary {
  department: Department;
  score: number;
  band: ScoreBand;
  submissionRate: number;
  submittedCount: number;
  totalCount: number;
}

export interface DashboardSummary {
  companyHealthScore: number;
  companyBand: ScoreBand;
  kpisOnTarget: { count: number; total: number; percent: number };
  departmentsCritical: { count: number; names: string[] };
  submissionRate: { count: number; total: number; percent: number };
  departmentRanking: DepartmentScoreSummary[];
}

export interface TrendPoint {
  period: string;
  departmentId: string;
  departmentName: string;
  score: number;
  band: ScoreBand;
}

export interface DrillDownData {
  department: Department;
  biggestMiss: KPIWithSubmission | null;
  kpis: KPIWithSubmission[];
  submissionRate: number;
  submittedCount: number;
  totalCount: number;
}

export interface MemberSubmissionStatus {
  user: User;
  submitted: boolean;
}
