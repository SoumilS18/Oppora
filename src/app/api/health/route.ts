import { NextResponse } from "next/server";

export async function GET() {
  const hasTinyFishKey = Boolean(
    process.env.TINYFISH_API_KEY &&
      process.env.TINYFISH_API_KEY !== "your_tinyfish_api_key_here"
  );
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
  );

  return NextResponse.json({
    status: "ok",
    app: "Oppora",
    version: "1.0.0",
    hackathon: "AZINHACK '26",
    tinyFishConfigured: hasTinyFishKey,
    geminiConfigured: hasGeminiKey,
    defaultMode: hasTinyFishKey ? "live" : "demo",
    timestamp: new Date().toISOString(),
  });
}
