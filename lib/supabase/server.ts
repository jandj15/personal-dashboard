import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Supabase client. Service-role ONLY (bypasses RLS). RLS is locked so the
 * anon key reads/writes nothing — all data access goes through this server client,
 * reached via cookie-gated API routes. Returns null when unconfigured so callers
 * fall back to the bundled default dataset (the no-DB seed/dev story).
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
