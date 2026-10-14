import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const orders = await operationsService.getRestockOrders(auth.userId);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: "Failed to fetch restock orders", code: err.code || "SERVER_ERROR", details: err.details || err.message },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const { supplierId, items, notes } = body;

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Valid supplierId and at least one item are required" },
        { status: 400 }
      );
    }

    const order = await operationsService.createRestockOrder(auth.userId, { supplierId, items, notes });
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create restock order", code: err.code || "RESTOCK_FAILED", details: err.details },
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
    const { orderId, receivedQuantities } = body;

    if (!orderId || !receivedQuantities) {
      return NextResponse.json(
        { error: "Both orderId and receivedQuantities map are required" },
        { status: 400 }
      );
    }

    const result = await operationsService.receiveRestockStock(auth.userId, orderId, receivedQuantities);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to receive restock stock", code: err.code || "RECEIVE_FAILED", details: err.details },
      { status }
    );
  }
}
