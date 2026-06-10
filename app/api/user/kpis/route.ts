import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserKPIs } from "@/lib/queries";
import { currentPeriod } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const period = request.nextUrl.searchParams.get("period") ?? currentPeriod();

  const kpis = await getUserKPIs(supabase, user.id, user.department_id, period);
  return NextResponse.json(kpis);
}
