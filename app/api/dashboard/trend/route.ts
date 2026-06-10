import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getTrendData } from "@/lib/queries";
import { currentPeriod } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const period = request.nextUrl.searchParams.get("period") ?? currentPeriod();

  const trend = await getTrendData(supabase, period, 6);
  return NextResponse.json(trend);
}
