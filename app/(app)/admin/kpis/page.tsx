import { getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentPeriod } from "@/lib/utils";
import { Department, KPI, User } from "@/types";
import { AdminClient } from "./AdminClient";

export default async function AdminKPIsPage() {
  const user = await getCurrentUser();
  requireRole(user, ["admin"]);

  const supabase = await createClient();
  const period = currentPeriod();

  const [{ data: departments }, { data: kpis }, { data: users }] = await Promise.all([
    supabase.from("departments").select("*").order("name"),
    supabase.from("kpis").select("*").eq("period", period).order("name"),
    supabase.from("users").select("*").order("full_name"),
  ]);

  return (
    <AdminClient
      initialDepartments={(departments ?? []) as Department[]}
      initialKpis={(kpis ?? []) as KPI[]}
      users={(users ?? []) as User[]}
      period={period}
    />
  );
}
