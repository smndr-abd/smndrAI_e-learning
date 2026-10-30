import { createClient } from "@supabase/supabase-js";

// Supabase client with the SERVICE ROLE key: it bypasses all access rules.
// Use it ONLY in server code, and only after you have checked the user yourself
// (for example: creating an enrollment after a free signup or a verified payment).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
