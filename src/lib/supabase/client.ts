import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Creates a browser-side Supabase client for Next.js App Router client components.
 */
export function createClient() {
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    // Return a dummy client or throw helpful warning
    return createBrowserClient(
      url || "https://placeholder-project.supabase.co",
      anonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(url, anonKey);
}
