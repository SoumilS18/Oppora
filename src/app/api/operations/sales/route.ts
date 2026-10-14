import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { CreateSaleInputSchema } from "@/types/operations";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period") as "7d" | "30d" | "90d" | "all" | null;
    const period = periodParam === "7d" || periodParam === "90d" || periodParam === "all" ? periodParam : undefined;

    const { sales, storageMode, isDemo } = await operationsService.getSales(auth.userId, period);
    return NextResponse.json({ success: true, sales, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch sales", code: err.code || "SERVER_ERROR", details: err.details },
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
    const parse = CreateSaleInputSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }

    const sale = await operationsService.createSale(auth.userId, parse.data);
    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to record sale", code: err.code || "SALE_CREATION_FAILED", details: err.details },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get("id");
    const reason = searchParams.get("reason") || "Customer return";

    if (!saleId) {
      return NextResponse.json({ error: "Sale id is required" }, { status: 400 });
    }

    const cancelledSale = await operationsService.cancelSale(auth.userId, saleId, reason);
    return NextResponse.json({ success: true, sale: cancelledSale });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to cancel sale", code: err.code || "CANCEL_SALE_FAILED", details: err.details },
      { status }
    );
  }
}
