import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let supabase;

const authConfig = {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
  supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key"
  );
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, authConfig);
  } catch {
    supabase = createClient("https://placeholder.supabase.co", "placeholder-key", authConfig);
  }
}

export { supabase };
