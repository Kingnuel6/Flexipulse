import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (user.role === "admin") {
    redirect("/dashboard");
  }
  if (user.role === "manager") {
    redirect("/department");
  }
  redirect("/me");
}
