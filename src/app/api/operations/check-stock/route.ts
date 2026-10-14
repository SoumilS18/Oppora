import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const result = await operationsService.checkStockNow(auth.userId);
    return NextResponse.json({
      success: true,
      message: `Stock check complete: ${result.checkedProducts} products inspected. Found ${result.lowStockCount} below threshold. Created ${result.newDraftsCreated} new supplier restock draft(s).`,
      ...result,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to execute stock check", code: err.code || "CHECK_STOCK_FAILED", details: err.details },
      { status }
    );
  }
}
