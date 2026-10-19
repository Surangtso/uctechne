import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// server-side only: the service-role key bypasses RLS, so it must never reach the browser
export function db(): SupabaseClient {
  if (client) return client;
  // the dashboard shows the REST URL (".../rest/v1/") next to the project URL; createClient wants the bare one
  const url = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
