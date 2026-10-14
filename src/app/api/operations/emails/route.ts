import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as "draft" | "approved" | "sent" | "failed" | null;
    const { drafts, storageMode, isDemo } = await operationsService.getSupplierEmailDrafts(
      auth.userId,
      statusParam || undefined
    );
    return NextResponse.json({ success: true, drafts, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch email drafts", code: err.code || "SERVER_ERROR", details: err.details },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
    }

    const updated = await operationsService.updateSupplierEmailDraft(auth.userId, id, updates);
    return NextResponse.json({ success: true, draft: updated });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update draft", code: err.code || "UPDATE_DRAFT_FAILED", details: err.details },
      { status }
    );
  }
}
