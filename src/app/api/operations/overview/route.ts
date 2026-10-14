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
    const periodParam = searchParams.get("period") as "7d" | "30d" | "90d" | "all" | null;
    const period = periodParam === "7d" || periodParam === "90d" || periodParam === "all" ? periodParam : "30d";

    const { metrics, storageMode, isDemo } = await operationsService.getOverviewMetrics(auth.userId, period);
    return NextResponse.json({ success: true, metrics, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to retrieve overview metrics", code: err.code || "SERVER_ERROR", details: err.details },
      { status }
    );
  }
}
