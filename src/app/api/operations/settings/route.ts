import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { BusinessSettingsSchema } from "@/types/operations";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const { settings, storageMode, isDemo } = await operationsService.getSettings(auth.userId);
    return NextResponse.json({ success: true, settings, storageMode, isDemo });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch settings", code: err.code || "SERVER_ERROR", details: err.details },
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
    const parse = BusinessSettingsSchema.partial().safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`) },
        { status: 400 }
      );
    }

    const updated = await operationsService.updateSettings(auth.userId, parse.data);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    const status = err.status || 400;
    return NextResponse.json(
      { error: err.message || "Failed to update settings", code: err.code || "UPDATE_SETTINGS_FAILED", details: err.details },
      { status }
    );
  }
}
