import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { ProductInputSchema } from "@/types/operations";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const lowStock = searchParams.get("lowStock") === "true";

    const { products, storageMode, isDemo } = await operationsService.getProducts(
      auth.userId,
      search,
      category,
      lowStock
    );
    return NextResponse.json({ success: true, products, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch products", code: err.code || "SERVER_ERROR", details: err.details },
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
    const parse = ProductInputSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }

    const product = await operationsService.createProduct(auth.userId, parse.data);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to create product", code: err.code || "CREATE_PRODUCT_FAILED", details: err.details },
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
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const product = await operationsService.updateProduct(auth.userId, id, updates);
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update product", code: err.code || "UPDATE_PRODUCT_FAILED", details: err.details },
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
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const ok = await operationsService.archiveProduct(auth.userId, id);
    if (!ok) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to archive product", code: err.code || "ARCHIVE_FAILED", details: err.details },
      { status }
    );
  }
}
