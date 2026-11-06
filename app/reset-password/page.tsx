import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/app/login/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Only reachable through the emailed link, which signs the user in temporarily.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Open the link from your email to reset your password.")}`
    );
  }

  return (
    <div style={{ maxWidth: 460 }}>
      <div className="eyebrow">Secure channel</div>
      <h1 className="glitch" data-text="New passkey">New passkey</h1>
      <p className="muted">Choose a new password for {user.email}.</p>

      {searchParams.error && <div className="notice error">{searchParams.error}</div>}

      <form action={updatePassword} className="card">
        <label>
          // New password
          <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="min. 6 characters" />
        </label>
        <label>
          // Repeat new password
          <input name="confirm" type="password" required minLength={6} autoComplete="new-password" />
        </label>
        <button className="btn" type="submit">Save new password</button>
      </form>
    </div>
  );
}