import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { OpportunitySchema } from "@/types/opportunity";

export async function GET() {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return NextResponse.json(
      { error: "Database not configured. Using browser storage." },
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

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data || [] });
}

export async function POST(request: Request) {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { opportunity, notes } = body;
  if (!opportunity || !opportunity.id) {
    return NextResponse.json({ error: "Missing opportunity data" }, { status: 400 });
  }

  // Validate opportunity structure
  const parseResult = OpportunitySchema.safeParse(opportunity);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid opportunity schema", details: parseResult.error.errors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .upsert({
      user_id: user.id,
      opportunity_id: opportunity.id,
      opportunity_snapshot: parseResult.data,
      user_notes: notes || "",
    }, { onConflict: "user_id,opportunity_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, saved: data });
}

export async function DELETE(request: Request) {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunityId");

  if (!opportunityId) {
    return NextResponse.json({ error: "Missing opportunityId query parameter" }, { status: 400 });
  }

  const { error } = await supabase
    .from("saved_opportunities")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, opportunityId });
}
