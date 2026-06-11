import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for privileged operations (creating/deleting auth users).
// Never expose this client or the service role key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
