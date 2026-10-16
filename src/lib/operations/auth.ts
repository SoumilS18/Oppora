import { NextRequest } from "next/server";
import { createClient } from "../supabase/server";
import { resolveStorageMode, isDemoOrTestUser } from "./service";
import { DEMO_USER_ID } from "./store";

export interface AuthContext {
  userId: string;
  isDemo: boolean;
  error?: string;
  status?: number;
}

/**
 * Server-side session verification helper.
 * Strictly derives identity from the authenticated Supabase session.
 * In production, sensitive operations NEVER trust browser-supplied user IDs or test headers.
 */
export async function getAuthenticatedOperationsUser(req?: NextRequest): Promise<AuthContext> {
  const { mode } = resolveStorageMode();
  const isProd = process.env.NODE_ENV === "production";

  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user && user.id) {
      return {
        userId: user.id,
        isDemo: false,
      };
    }
  } catch {
    // Session check failed or unconfigured
  }

  // 1. Integration test header: STRICTLY disallowed in production!
  // Allowed ONLY in non-production test/development environments for isolated test suites.
  if (!isProd && req) {
    const testHeaderUser = req.headers.get("x-oppora-user-id");
    if (testHeaderUser && testHeaderUser.trim()) {
      const sanitized = testHeaderUser.trim();
      return {
        userId: sanitized,
        isDemo: isDemoOrTestUser(sanitized),
      };
    }
  }

  // 2. Allow read-only exploration of Demo Mode for GET requests
  // Strictly isolated to DEMO_USER_ID (uses isolated in-memory demo data, NEVER real Supabase records)
  if (req && req.method === "GET") {
    return {
      userId: DEMO_USER_ID,
      isDemo: true,
    };
  }

  // 3. Reject unauthenticated mutations consistently across all modes
  return {
    userId: "",
    isDemo: false,
    error: "Authentication required. Active server session not found. Please sign in to perform this action.",
    status: 401,
  };
}

