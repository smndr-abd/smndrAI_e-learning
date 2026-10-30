"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const origin = headers().get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: {
      data: { full_name: String(formData.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  // If email confirmation is switched off, the user is already logged in.
  if (data.session) redirect("/dashboard");
  redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account.")}`);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
