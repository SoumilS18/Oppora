import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const { isConfigured } = getSupabaseConfig();

  // If Supabase is not configured, allow access without broken redirect loops
  if (!isConfigured) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  // Private routes requiring authentication
  const isProtectedPage = pathname.startsWith("/workspace");
  const isProtectedApi =
    pathname.startsWith("/api/auth/profile") ||
    pathname.startsWith("/api/auth/saved") ||
    pathname.startsWith("/api/auth/checklist");

  // 1. Private API endpoints
  if (isProtectedApi && !user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to access this resource." },
      { status: 401 }
    );
  }

  // 2. Private UI pages: redirect unauthenticated users to login
  if (isProtectedPage && !user) {
    const loginUrl = new URL("/login", request.url);
    // Sanitize and set validated redirect parameter
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Auth pages (login, signup): redirect already authenticated users to workspace
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage && user) {
    const rawNext = searchParams.get("next");
    // Validate redirect to prevent open redirect vulnerabilities (must start with / and not //)
    const isValidInternalNext = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//");
    const destination = isValidInternalNext ? rawNext : "/workspace";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.jpg, oppora-logo.jpg, oppora-showcase.mp4
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
