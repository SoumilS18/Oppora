import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { SupplierInputSchema } from "@/types/operations";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const { suppliers, storageMode, isDemo } = await operationsService.getSuppliers(auth.userId, search);
    return NextResponse.json({ success: true, suppliers, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch suppliers", code: err.code || "SERVER_ERROR", details: err.details },
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
    const parse = SupplierInputSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }

    const supplier = await operationsService.createSupplier(auth.userId, parse.data);
    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create supplier", code: err.code || "CREATE_SUPPLIER_FAILED", details: err.details },
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
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Supplier id is required" }, { status: 400 });
    }

    const supplier = await operationsService.updateSupplier(auth.userId, id, updates);
    return NextResponse.json({ success: true, supplier });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update supplier", code: err.code || "UPDATE_SUPPLIER_FAILED", details: err.details },
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Supplier id is required" }, { status: 400 });
    }

    const ok = await operationsService.archiveSupplier(auth.userId, id);
    if (!ok) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to archive supplier", code: err.code || "ARCHIVE_FAILED", details: err.details },
      { status }
    );
  }
}
