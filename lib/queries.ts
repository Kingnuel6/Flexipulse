import { SupabaseClient } from "@supabase/supabase-js";
import {
  Department,
  KPI,
  KPIWithSubmission,
  Submission,
  User,
  DashboardSummary,
  DepartmentScoreSummary,
  TrendPoint,
  DrillDownData,
  MemberSubmissionStatus,
} from "@/types";
import {
  scoreKPI,
  scoreBand,
  departmentScore,
  companyHealthScore,
} from "@/lib/scoring";
import { lastNPeriods } from "@/lib/utils";

function attachScores(kpis: KPI[], submissions: Submission[]): KPIWithSubmission[] {
  return kpis.map((kpi) => {
    const submission = submissions.find((s) => s.kpi_id === kpi.id) ?? null;
    const actual = submission?.actual_value ?? 0;
    const score = submission ? scoreKPI(Number(actual), Number(kpi.target_value)) : 0;
    return {
      ...kpi,
      submission,
      score,
      band: scoreBand(score),
    };
  });
}

export async function getDashboardSummary(
  supabase: SupabaseClient,
  period: string
): Promise<DashboardSummary> {
  const [{ data: departments }, { data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("kpis").select("*").eq("period", period),
    supabase.from("submissions").select("*").eq("period", period),
  ]);

  const allDepartments = (departments ?? []) as Department[];
  const allKpis = (kpis ?? []) as KPI[];
  const allSubmissions = (submissions ?? []) as Submission[];

  const enriched = attachScores(allKpis, allSubmissions);

  const departmentRanking: DepartmentScoreSummary[] = allDepartments.map((dept) => {
    const deptKpis = enriched.filter((k) => k.department_id === dept.id);
    const scores = deptKpis.map((k) => k.score);
    const score = departmentScore(scores);
    const submittedCount = deptKpis.filter((k) => k.submission).length;
    return {
      department: dept,
      score,
      band: scoreBand(score),
      submissionRate:
        deptKpis.length === 0 ? 0 : Math.round((submittedCount / deptKpis.length) * 100),
      submittedCount,
      totalCount: deptKpis.length,
    };
  });

  departmentRanking.sort((a, b) => a.score - b.score);

  const companyScore = companyHealthScore(departmentRanking.map((d) => d.score));

  const onTargetCount = enriched.filter((k) => k.score === 100).length;
  const criticalDepts = departmentRanking.filter((d) => d.band === "critical");
  const totalSubmissions = allKpis.length;
  const submittedTotal = enriched.filter((k) => k.submission).length;

  return {
    companyHealthScore: companyScore,
    companyBand: scoreBand(companyScore),
    kpisOnTarget: {
      count: onTargetCount,
      total: allKpis.length,
      percent: allKpis.length === 0 ? 0 : Math.round((onTargetCount / allKpis.length) * 100),
    },
    departmentsCritical: {
      count: criticalDepts.length,
      names: criticalDepts.map((d) => d.department.name),
    },
    submissionRate: {
      count: submittedTotal,
      total: totalSubmissions,
      percent:
        totalSubmissions === 0 ? 0 : Math.round((submittedTotal / totalSubmissions) * 100),
    },
    departmentRanking,
  };
}

export async function getTrendData(
  supabase: SupabaseClient,
  currentPeriod: string,
  months = 6
): Promise<TrendPoint[]> {
  const periods = lastNPeriods(months, currentPeriod).reverse(); // oldest first

  const [{ data: departments }, { data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("kpis").select("*").in("period", periods),
    supabase.from("submissions").select("*").in("period", periods),
  ]);

  const allDepartments = (departments ?? []) as Department[];
  const allKpis = (kpis ?? []) as KPI[];
  const allSubmissions = (submissions ?? []) as Submission[];

  const points: TrendPoint[] = [];

  for (const period of periods) {
    const periodKpis = allKpis.filter((k) => k.period === period);
    const periodSubmissions = allSubmissions.filter((s) => s.period === period);
    const enriched = attachScores(periodKpis, periodSubmissions);

    for (const dept of allDepartments) {
      const deptScores = enriched
        .filter((k) => k.department_id === dept.id)
        .map((k) => k.score);
      const score = departmentScore(deptScores);
      points.push({
        period,
        departmentId: dept.id,
        departmentName: dept.name,
        score,
        band: scoreBand(score),
      });
    }
  }

  return points;
}

export async function getDrillDown(
  supabase: SupabaseClient,
  departmentId: string,
  period: string
): Promise<DrillDownData | null> {
  const [{ data: department }, { data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from("departments").select("*").eq("id", departmentId).single(),
    supabase.from("kpis").select("*").eq("department_id", departmentId).eq("period", period),
    supabase
      .from("submissions")
      .select("*, kpis!inner(department_id, period)")
      .eq("kpis.department_id", departmentId)
      .eq("kpis.period", period),
  ]);

  if (!department) return null;

  const deptKpis = (kpis ?? []) as KPI[];
  const deptSubmissions = (submissions ?? []) as Submission[];
  const enriched = attachScores(deptKpis, deptSubmissions);

  let biggestMiss: KPIWithSubmission | null = null;
  let biggestGap = -Infinity;
  for (const kpi of enriched) {
    const actual = Number(kpi.submission?.actual_value ?? 0);
    const gap = Number(kpi.target_value) - actual;
    if (gap > biggestGap) {
      biggestGap = gap;
      biggestMiss = kpi;
    }
  }

  const submittedCount = enriched.filter((k) => k.submission).length;

  return {
    department: department as Department,
    biggestMiss,
    kpis: enriched,
    submissionRate: enriched.length === 0 ? 100 : Math.round((submittedCount / enriched.length) * 100),
    submittedCount,
    totalCount: enriched.length,
  };
}

export async function getDepartmentKPIs(
  supabase: SupabaseClient,
  departmentId: string,
  period: string
): Promise<KPIWithSubmission[]> {
  const [{ data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from("kpis").select("*").eq("department_id", departmentId).eq("period", period),
    supabase
      .from("submissions")
      .select("*, kpis!inner(department_id, period)")
      .eq("kpis.department_id", departmentId)
      .eq("kpis.period", period),
  ]);

  return attachScores((kpis ?? []) as KPI[], (submissions ?? []) as Submission[]);
}

export async function getDepartmentMembers(
  supabase: SupabaseClient,
  departmentId: string,
  period: string
): Promise<MemberSubmissionStatus[]> {
  const [{ data: members }, { data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from("users").select("*").eq("department_id", departmentId),
    supabase.from("kpis").select("*").eq("department_id", departmentId).eq("period", period),
    supabase
      .from("submissions")
      .select("*, kpis!inner(department_id, period)")
      .eq("kpis.department_id", departmentId)
      .eq("kpis.period", period),
  ]);

  const allMembers = (members ?? []) as User[];
  const allKpis = (kpis ?? []) as KPI[];
  const allSubmissions = (submissions ?? []) as Submission[];

  return allMembers.map((member) => {
    // KPIs assigned directly to this member, plus department-level KPIs (assigned_to null)
    // are considered "submitted" if a submission exists from this member.
    const memberKpis = allKpis.filter(
      (k) => k.assigned_to === member.id || k.assigned_to === null
    );
    const submitted =
      memberKpis.length === 0
        ? false
        : memberKpis.every((k) =>
            allSubmissions.some((s) => s.kpi_id === k.id && s.user_id === member.id)
          );

    return { user: member, submitted };
  });
}

export async function getUserKPIs(
  supabase: SupabaseClient,
  userId: string,
  departmentId: string | null,
  period: string
): Promise<KPIWithSubmission[]> {
  let query = supabase.from("kpis").select("*").eq("period", period);

  if (departmentId) {
    query = query.eq("department_id", departmentId).or(`assigned_to.eq.${userId},assigned_to.is.null`);
  } else {
    query = query.eq("assigned_to", userId);
  }

  const { data: kpis } = await query;
  const allKpis = (kpis ?? []) as KPI[];

  if (allKpis.length === 0) return [];

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", userId)
    .in(
      "kpi_id",
      allKpis.map((k) => k.id)
    );

  return attachScores(allKpis, (submissions ?? []) as Submission[]);
}

export async function getSubmissionHistory(
  supabase: SupabaseClient,
  userId: string,
  periods: string[]
): Promise<(Submission & { kpi: KPI })[]> {
  const { data } = await supabase
    .from("submissions")
    .select("*, kpi:kpis(*)")
    .eq("user_id", userId)
    .in("period", periods)
    .order("period", { ascending: false });

  return (data ?? []) as unknown as (Submission & { kpi: KPI })[];
}
