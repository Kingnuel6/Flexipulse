import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary, getTrendData } from "@/lib/queries";
import { currentPeriod } from "@/lib/utils";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  requireRole(user, ["admin"]);

  const supabase = await createClient();
  const period = currentPeriod();

  const [summary, trend] = await Promise.all([
    getDashboardSummary(supabase, period),
    getTrendData(supabase, period, 6),
  ]);

  return <DashboardClient summary={summary} trend={trend} period={period} />;
}
