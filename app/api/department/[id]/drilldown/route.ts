import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getDrillDown } from "@/lib/queries";
import { currentPeriod } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const period = request.nextUrl.searchParams.get("period") ?? currentPeriod();

  const drilldown = await getDrillDown(supabase, id, period);
  if (!drilldown) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(drilldown);
}
