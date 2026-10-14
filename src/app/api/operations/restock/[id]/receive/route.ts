import { NextRequest, NextResponse } from "next/server";
import { operationsStore } from "@/lib/operations/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { receivedQuantities } = body;

    if (!receivedQuantities || typeof receivedQuantities !== "object") {
      return NextResponse.json(
        { error: "receivedQuantities mapping (productId -> quantity) is required" },
        { status: 400 }
      );
    }

    const result = operationsStore.receiveRestockStock(orderId, receivedQuantities);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to receive stock" },
      { status: 400 }
    );
  }
}
