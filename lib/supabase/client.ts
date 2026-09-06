import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY -- set them in .env.local."
  );
}

// Single browser-side Supabase client, safe to import anywhere in
// client components. The anon key only ever grants what the schema's
// row-level-security policies allow.
export const supabase = createClient(url, anonKey);
