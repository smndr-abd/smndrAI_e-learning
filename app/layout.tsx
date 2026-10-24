import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "smndr AI_ENGINEER // Academy",
  description: "A 9-month, project-based path from Python to production AI agents.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="scanlines" aria-hidden="true" />
        <header className="site">
          <div className="container">
            <Link href="/" className="brand">
              <span className="brand-mark">//</span>smndr AI_ENGINEER<span className="cursor">_</span>
            </Link>
            <nav>
              {user ? (
                <>
                  <span className="who">{user.email}</span>
                  <Link href="/dashboard">My courses</Link>
                  <form action={signOut}>
                    <button className="btn link" type="submit">Log out</button>
                  </form>
                </>
              ) : (
                <Link href="/login">Log in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site">
          <span className="brand-mark">//</span> smndrAI Academy <span>//</span> restart the world
          <span className="brand-mark">//</span> © 2026 <span>//</span> 
        </footer>
      </body>
    </html>
  );
}