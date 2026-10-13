import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Creates a server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 */
export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey, isConfigured } = getSupabaseConfig();

  return createServerClient(
    isConfigured ? url : "https://placeholder-project.supabase.co",
    isConfigured ? anonKey : "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
