import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

// Browser side: only the public (anon) key is used, so everything here is safe to ship to readers.
// Without the NEXT_PUBLIC_ settings there is no login and the page simply hides the button.
let client: SupabaseClient | null | undefined;

export function authClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // named without "KEY": Vercel refuses to save a NEXT_PUBLIC_ variable whose name looks like a secret, and this one is public by design
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  client = url && key ? createClient(url, key) : null;
  return client;
}

export type { Session };
