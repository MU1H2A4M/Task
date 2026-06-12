import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/**
 * True when both env vars are present. When false, the app renders a
 * friendly setup screen instead of crashing with a blank page.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && supabaseAnonKey,
);

/**
 * Lazily created so importing this module never throws. All call sites
 * are behind the <ConfigGate>, which blocks rendering until the env
 * vars exist — so the non-null assertion below is safe in practice.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Copy .env.example to .env, fill in " +
          "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.",
      );
    }
    client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  }
  return client;
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? getSupabase()
  : (new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          "Supabase is not configured. Copy .env.example to .env and restart.",
        );
      },
    }) as SupabaseClient);
