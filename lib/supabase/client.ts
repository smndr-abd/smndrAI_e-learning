import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the BROWSER. It only holds the public URL and the
// public (anon/publishable) key. Used for direct file uploads.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
