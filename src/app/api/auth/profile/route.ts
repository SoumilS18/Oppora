import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { UserProfileSchema } from "@/types/opportunity";

export async function GET() {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured. Using browser-local profile." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let activeProfile = profile;

  // If profile row doesn't exist yet (e.g. user registered before trigger), seed it idempotently
  if (!activeProfile) {
    const metaFullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "";

    const { data: createdProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: metaFullName,
        country: "India",
        industry: "HealthTech & AI",
        startup_stage: "Prototype",
        organization_type: "Incorporated Startup",
        entity_type: "Private Limited (Pvt Ltd)",
        dpiit_recognized: "In Progress / Not Sure",
      })
      .select()
      .single();

    if (createdProfile) {
      activeProfile = createdProfile;
    }
  } else if (!activeProfile.full_name && user.user_metadata?.full_name) {
    // If profile exists but full_name is empty, sync from user_metadata
    await supabase
      .from("profiles")
      .update({ full_name: user.user_metadata.full_name })
      .eq("id", user.id);
    activeProfile.full_name = user.user_metadata.full_name;
  }

  return NextResponse.json({ profile: activeProfile || null, user });
}

export async function POST(request: Request) {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Validate profile fields
  const parseResult = UserProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid profile payload", details: parseResult.error.errors },
      { status: 400 }
    );
  }

  const validated = parseResult.data;

  const profileData = {
    id: user.id,
    country: validated.country,
    state: validated.state || "",
    industry: validated.industry,
    startup_stage: validated.stage,
    organization_type: validated.organizationType,
    entity_type: validated.entityType || "Other / Unspecified",
    dpiit_recognized: validated.dpiitRecognized || "In Progress / Not Sure",
    funding_needs: validated.fundingNeed || "",
    keywords: validated.focusKeywords || [],
    startup_description: validated.description || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profileData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: data });
}
