import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User } from "@/types";

export async function getCurrentUser(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return profile as User;
}

export function requireRole(user: User, roles: User["role"][]) {
  if (!roles.includes(user.role)) {
    redirect("/");
  }
}
