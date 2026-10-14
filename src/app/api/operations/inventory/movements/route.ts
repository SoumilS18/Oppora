import { NextRequest, NextResponse } from "next/server";
import { operationsStore } from "@/lib/operations/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || undefined;
    const movements = operationsStore.getStockMovements(productId);
    return NextResponse.json({ success: true, movements });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch stock movements", details: err.message },
      { status: 500 }
    );
  }
}
