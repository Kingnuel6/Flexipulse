import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const body = await request.json();
  const submissions = Array.isArray(body.submissions) ? body.submissions : [body];

  const rows = submissions.map((s: { kpi_id: string; actual_value: number; notes?: string; period: string }) => ({
    kpi_id: s.kpi_id,
    user_id: user.id,
    actual_value: s.actual_value,
    notes: s.notes ?? null,
    period: s.period,
  }));

  const { data, error } = await supabase
    .from("submissions")
    .upsert(rows, { onConflict: "kpi_id,user_id,period" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
