import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The link in the password-reset email lands here.
// It turns the code into a session, then sends the user to the "new password" page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/reset-password`);
  }
  return NextResponse.redirect(
    `${origin}/forgot-password?error=${encodeURIComponent("Reset link is invalid or expired")}`
  );
}
