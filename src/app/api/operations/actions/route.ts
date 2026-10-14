import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { actions, summary, recommendations, storageMode, isDemo } = await operationsService.getActionCenter(auth.userId);
    return NextResponse.json({
      success: true,
      actions,
      summary,
      recommendations,
      storageMode,
      isDemo,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to retrieve action centre items", code: err.code || "SERVER_ERROR" },
      { status }
    );
  }
}
