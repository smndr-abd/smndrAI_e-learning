import { login, signup } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <div style={{ maxWidth: 460 }}>
      <div className="eyebrow">Secure channel</div>
      <h1 className="glitch" data-text="Access terminal">Access terminal</h1>
      <p className="muted">Authenticate to enter the academy. New here? Fill in your name and hit sign up.</p>

      {searchParams.error && <div className="notice error">{searchParams.error}</div>}
      {searchParams.message && <div className="notice ok">{searchParams.message}</div>}

      <form className="card">
        <label>
          // Callsign (name, for sign up)
          <input name="full_name" type="text" autoComplete="name" placeholder="neo" />
        </label>
        <label>
          // Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@domain.com" />
        </label>
        <label>
          // Passkey
          <input name="password" type="password" required minLength={6} autoComplete="current-password" placeholder="min. 6 characters" />
        </label>
        <div className="row">
          <button className="btn" formAction={login}>Log in</button>
          <button className="btn secondary" formAction={signup}>Sign up</button>
        </div>
      </form>
    </div>
  );
}