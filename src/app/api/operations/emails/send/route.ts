import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const { draftId, approved } = body;

    if (!draftId) {
      return NextResponse.json({ error: "draftId is required" }, { status: 400 });
    }

    if (!approved) {
      return NextResponse.json(
        { error: "Explicit user approval is mandatory before any supplier email can be dispatched." },
        { status: 400 }
      );
    }

    const result = await operationsService.approveAndSendSupplierEmail(auth.userId, draftId);
    return NextResponse.json({
      success: result.success,
      draft: result.draft,
      message: result.message,
    });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to send email", code: err.code || "SEND_EMAIL_FAILED", details: err.details },
      { status }
    );
  }
}
