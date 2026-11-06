import Link from "next/link";
import { requestPasswordReset } from "@/app/login/actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <div style={{ maxWidth: 460 }}>
      <div className="eyebrow">Recovery channel</div>
      <h1 className="glitch" data-text="Reset passkey">Reset passkey</h1>
      <p className="muted">Enter your email and we will send you a link to choose a new password.</p>

      {searchParams.error && <div className="notice error">{searchParams.error}</div>}
      {searchParams.message && <div className="notice ok">{searchParams.message}</div>}

      <form action={requestPasswordReset} className="card">
        <label>
          // Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@domain.com" />
        </label>
        <div className="row">
          <button className="btn" type="submit">Send reset link</button>
          <Link href="/login">Back to log in</Link>
        </div>
      </form>
    </div>
  );
}