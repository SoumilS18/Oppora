import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");

  // Validate internal redirect to prevent open redirect vulnerabilities
  let destination = "/workspace";
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
    destination = rawNext;
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${destination}`);
    }
  }

  // If code is missing or exchange fails, redirect to login with error notice
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=${encodeURIComponent(
      "Verification link has expired or is invalid. Please request a new link."
    )}`
  );
}
