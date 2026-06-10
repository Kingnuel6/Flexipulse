import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getDepartmentMembers } from "@/lib/queries";
import { currentPeriod } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (user.role === "manager" && user.department_id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const period = request.nextUrl.searchParams.get("period") ?? currentPeriod();

  const members = await getDepartmentMembers(supabase, id, period);
  return NextResponse.json(members);
}
