import { NextRequest } from "next/server";
import { createClient } from "../supabase/server";
import { resolveStorageMode } from "./service";
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
 * In production or Supabase mode, sensitive operations NEVER trust browser-supplied user IDs.
 */
export async function getAuthenticatedOperationsUser(req?: NextRequest): Promise<AuthContext> {
  const { mode } = resolveStorageMode();

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

  // In production or Supabase mode, unauthenticated requests are strictly rejected
  if (mode === "supabase" || process.env.NODE_ENV === "production") {
    return {
      userId: "",
      isDemo: false,
      error: "Authentication required. Active server session not found.",
      status: 401,
    };
  }

  // In development/test mode with memory storage:
  // Allow integration testing with separate test users via test header
  if (req) {
    const testHeaderUser = req.headers.get("x-oppora-user-id");
    if (testHeaderUser && testHeaderUser.trim()) {
      return {
        userId: testHeaderUser.trim(),
        isDemo: testHeaderUser === DEMO_USER_ID,
      };
    }
  }

  // Default demo user for development/demo exploration
  return {
    userId: DEMO_USER_ID,
    isDemo: true,
  };
}
