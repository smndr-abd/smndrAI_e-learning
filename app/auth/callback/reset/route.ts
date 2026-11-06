import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the "reset your password" email lands here. We turn its code
// into a temporary login session, then send the user to the new-password form.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/reset-password`);
  }

  const msg = "That reset link is invalid or expired. Request a new one, and open it in the same browser.";
  return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent(msg)}`);
}