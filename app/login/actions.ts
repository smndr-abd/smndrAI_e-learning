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

// ---------- Forgot / reset password ----------

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") ?? "").trim();
  const origin = headers().get("origin") ?? "http://localhost:3000";

  if (email) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });
  }
  // Same message whether or not the email has an account, so nobody can
  // use this form to find out who is registered.
  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "If that email has an account, a reset link is on its way."
    )}`
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Your reset link expired. Request a new one.")}`
    );
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 6) {
    redirect(`/reset-password?error=${encodeURIComponent("Use at least 6 characters.")}`);
  }
  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeURIComponent("The two passwords do not match.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);

  redirect("/dashboard");
}