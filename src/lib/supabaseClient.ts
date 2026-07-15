import { createClient } from "@supabase/supabase-js";

const metaEnv = (import.meta as any).env || {};

// Load environment variables with fallback settings for local development
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
