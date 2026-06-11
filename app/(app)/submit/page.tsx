import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserKPIs } from "@/lib/queries";
import { currentPeriod, formatPeriod } from "@/lib/utils";
import { KPIForm } from "@/components/forms/KPIForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const period = currentPeriod();

  const kpis = await getUserKPIs(supabase, user.id, user.department_id, period);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Submit KPIs</h1>
        <p className="text-sm text-text-secondary">{formatPeriod(period)}</p>
      </div>

      <KPIForm initialKpis={kpis} period={period} />
    </div>
  );
}
