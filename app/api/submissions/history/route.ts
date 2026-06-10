import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSubmissionHistory } from "@/lib/queries";
import { currentPeriod, lastNPeriods } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const period = request.nextUrl.searchParams.get("period") ?? currentPeriod();
  const periods = lastNPeriods(3, period);

  const history = await getSubmissionHistory(supabase, user.id, periods);
  return NextResponse.json(history);
}
