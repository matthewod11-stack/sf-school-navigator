import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LooseSupabaseClient = SupabaseClient;

let publicClient: LooseSupabaseClient | null = null;

export function createPublicClient() {
  if (publicClient) return publicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  publicClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return publicClient;
}
