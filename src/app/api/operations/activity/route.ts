import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { timeline, storageMode, isDemo } = await operationsService.getActivityTimeline(auth.userId);
    return NextResponse.json({
      success: true,
      timeline,
      storageMode,
      isDemo,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to retrieve activity timeline", code: err.code || "SERVER_ERROR" },
      { status }
    );
  }
}
