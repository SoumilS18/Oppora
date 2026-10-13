/**
 * Supabase Environment Configuration Helper
 * Safely validates whether Supabase URL and Anon Key are configured.
 */

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes("your-project.supabase.co") &&
    !url.includes("your_supabase") &&
    url.startsWith("https://")
  );

  return {
    url,
    anonKey,
    isConfigured,
  };
}
