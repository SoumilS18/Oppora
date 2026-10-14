import { NextRequest, NextResponse } from "next/server";
import {
  researchSupplierWithTinyFish,
  researchProductAlternativesWithTinyFish,
  researchMarketIntelligenceWithTinyFish,
  TinyFishApiError,
} from "@/lib/tinyfish";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, query, notes, category, region } = body;

    if (!type || !query) {
      return NextResponse.json(
        { error: "Both 'type' (supplier | product | market) and 'query' are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.TINYFISH_API_KEY;
    if (!apiKey || apiKey === "your_tinyfish_api_key_here") {
      return NextResponse.json(
        {
          error: "TINYFISH_API_KEY is not configured in .env.local. Live web research requires an active TinyFish key.",
          code: "MISSING_API_KEY",
        },
        { status: 401 }
      );
    }

    if (type === "supplier") {
      const result = await researchSupplierWithTinyFish(query, notes || "", region || "IN", apiKey);
      return NextResponse.json({ success: true, type: "supplier", result });
    } else if (type === "product") {
      const result = await researchProductAlternativesWithTinyFish(
        query,
        category || "General",
        region || "India",
        apiKey
      );
      return NextResponse.json({ success: true, type: "product", result });
    } else if (type === "market") {
      const result = await researchMarketIntelligenceWithTinyFish(query, region || "IN", apiKey);
      return NextResponse.json({ success: true, type: "market", result });
    } else {
      return NextResponse.json(
        { error: `Unsupported research type: ${type}. Use 'supplier', 'product', or 'market'.` },
        { status: 400 }
      );
    }
  } catch (err: any) {
    const apiErr = err as TinyFishApiError;
    return NextResponse.json(
      {
        error: apiErr.message || err.message || "Failed to perform TinyFish research",
        code: apiErr.code || "RESEARCH_FAILED",
      },
      { status: apiErr.status || 500 }
    );
  }
}
