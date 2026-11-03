import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call this at the top of EVERY admin page and admin action.
// Only users whose profile role is 'admin' get through.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  return user;
}