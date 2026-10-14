import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { StockAdjustmentInputSchema } from "@/types/operations";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const parse = StockAdjustmentInputSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }

    const result = await operationsService.adjustStock(auth.userId, parse.data);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to adjust stock", code: err.code || "ADJUST_STOCK_FAILED", details: err.details },
      { status }
    );
  }
}
