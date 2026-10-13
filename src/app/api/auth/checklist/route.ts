import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: Request) {
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
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunityId");

  let query = supabase.from("saved_checklist_items").select("*").eq("user_id", user.id);
  if (opportunityId) {
    query = query.eq("opportunity_id", opportunityId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
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

  const { opportunityId, itemId, itemTitle, category, priority, isCompleted } = body;
  if (!opportunityId || !itemId) {
    return NextResponse.json({ error: "Missing opportunityId or itemId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_checklist_items")
    .upsert({
      user_id: user.id,
      opportunity_id: opportunityId,
      item_id: itemId,
      item_title: itemTitle || "",
      category: category || "",
      priority: priority || "medium",
      is_completed: Boolean(isCompleted),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,opportunity_id,item_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item: data });
}
