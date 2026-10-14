import { NextRequest, NextResponse } from "next/server";
import { operationsStore } from "@/lib/operations/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id;
    if (!saleId) {
      return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
    }

    let reason = "Customer return / order cancelled";
    try {
      const body = await req.json();
      if (body && typeof body.reason === "string" && body.reason.trim()) {
        reason = body.reason.trim();
      }
    } catch {}

    const cancelledSale = operationsStore.cancelSale(saleId, reason);
    return NextResponse.json({ success: true, sale: cancelledSale });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to cancel sale" },
      { status: 400 }
    );
  }
}
