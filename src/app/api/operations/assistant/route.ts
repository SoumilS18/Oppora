import { NextRequest, NextResponse } from "next/server";
import { operationsService } from "@/lib/operations/service";
import { getAuthenticatedOperationsUser } from "@/lib/operations/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { researchProductAlternativesWithTinyFish, TinyFishApiError } from "@/lib/tinyfish";

export interface AssistantResponse {
  answer: string;
  sourceType: "database" | "tinyfish_web" | "synthesis" | "action_needed";
  groundedFacts: string[];
  externalSources?: Array<{ title: string; url: string }>;
  suggestedAction?: {
    type: "review_email" | "adjust_stock" | "create_po" | "find_grant";
    label: string;
    targetRoute: string;
    payload?: any;
    requiresConfirmation: boolean;
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedOperationsUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error, code: "UNAUTHORIZED" }, { status: auth.status || 401 });
    }

    const body = await req.json();
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const promptLower = prompt.toLowerCase();

    // 1. Gather fresh database facts for the authenticated user
    const { metrics } = await operationsService.getOverviewMetrics(auth.userId, "30d");
    const { products: allProducts } = await operationsService.getProducts(auth.userId);
    const lowStockProducts = allProducts.filter((p) => p.isLowStock);
    const { sales: allSales } = await operationsService.getSales(auth.userId, "30d");
    const { drafts: pendingDrafts } = await operationsService.getSupplierEmailDrafts(auth.userId, "draft");
    const { settings } = await operationsService.getSettings(auth.userId);

    // 2. Deterministic Intent Detection for Operational Queries
    // A. "Which products need restocking?" / "low stock"
    if (
      promptLower.includes("restock") ||
      promptLower.includes("low stock") ||
      promptLower.includes("out of stock") ||
      promptLower.includes("need restocking")
    ) {
      if (lowStockProducts.length === 0) {
        return NextResponse.json({
          answer: "All products are currently stocked at or above their configured reorder thresholds. No immediate restocking actions are required.",
          sourceType: "database",
          groundedFacts: [
            `Total active products inspected: ${allProducts.length}`,
            "0 products below reorder threshold",
          ],
        });
      }

      const listDetails = lowStockProducts
        .map(
          (p) =>
            `• **${p.name}** (SKU: \`${p.sku}\`): **${p.currentStock} ${p.unitOfMeasure}** remaining (Threshold: ${p.reorderThreshold} ${p.unitOfMeasure}). Preferred Supplier: ${p.supplierName}. Suggested reorder: ${p.preferredReorderQuantity} ${p.unitOfMeasure}.`
        )
        .join("\n");

      return NextResponse.json({
        answer: `There are **${lowStockProducts.length} product(s)** currently at or below their reorder thresholds:\n\n${listDetails}\n\nYou can review automated restock email drafts or initiate a purchase order below.`,
        sourceType: "database",
        groundedFacts: [
          `Retrieved directly from database inventory ledger as of ${new Date().toLocaleTimeString()}`,
          `${lowStockProducts.length} low-stock products detected`,
        ],
        suggestedAction: {
          type: "review_email",
          label: "Review Restock Email Drafts",
          targetRoute: "/suppliers",
          requiresConfirmation: true,
        },
      });
    }

    // B. "Which products sold the most?" / "best sellers" / "sales velocity"
    if (
      promptLower.includes("sold the most") ||
      promptLower.includes("best selling") ||
      promptLower.includes("top products") ||
      promptLower.includes("most popular")
    ) {
      const salesMap: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
      for (const sale of allSales) {
        if (sale.status === "completed") {
          for (const item of sale.items) {
            if (!salesMap[item.productId]) {
              salesMap[item.productId] = { name: item.productName, sku: item.productSku, units: 0, revenue: 0 };
            }
            salesMap[item.productId].units += item.quantity;
            salesMap[item.productId].revenue += item.totalPrice;
          }
        }
      }

      const sorted = Object.values(salesMap).sort((a, b) => b.units - a.units);
      if (sorted.length === 0) {
        return NextResponse.json({
          answer: "No completed sales have been recorded yet in the past 30 days.",
          sourceType: "database",
          groundedFacts: ["0 sales records found in recent period"],
        });
      }

      const topList = sorted
        .slice(0, 5)
        .map(
          (item, idx) =>
            `${idx + 1}. **${item.name}** (\`${item.sku}\`): **${item.units} units sold**, generating **${settings.defaultCurrency} ${item.revenue.toLocaleString()}** in recorded revenue.`
        )
        .join("\n");

      return NextResponse.json({
        answer: `Here are your top-selling products over the past 30 days based on recorded sales:\n\n${topList}`,
        sourceType: "database",
        groundedFacts: [
          `Derived from ${allSales.length} validated sales transactions`,
          `Currency: ${settings.defaultCurrency}`,
        ],
        suggestedAction: {
          type: "adjust_stock",
          label: "View Sales Details",
          targetRoute: "/sales",
          requiresConfirmation: false,
        },
      });
    }

    // C. "Gross profit" / "revenue" / "financials"
    if (
      promptLower.includes("gross profit") ||
      promptLower.includes("profit") ||
      promptLower.includes("revenue") ||
      promptLower.includes("financials")
    ) {
      const profitText =
        metrics.estimatedGrossProfit !== null
          ? `**${settings.defaultCurrency} ${metrics.estimatedGrossProfit.toLocaleString()}** (Estimated based on historical line-item unit purchase costs)`
          : "Unavailable (Historical cost data missing or incomplete on sales in this period)";

      return NextResponse.json({
        answer: `### Financial Overview (Past 30 Days)\n\n• **Recorded Sales Revenue:** ${settings.defaultCurrency} ${metrics.revenue.toLocaleString()}\n• **Units Sold:** ${metrics.unitsSold} units\n• **Estimated Gross Profit:** ${profitText}\n• **Inventory Valuation:** ${settings.defaultCurrency} ${metrics.estimatedInventoryValuation.toLocaleString()} (Estimated replacement cost of current stock)\n\n*Note: Oppora provides operational estimates for business decision-making and is not an audited accounting ledger.*`,
        sourceType: "database",
        groundedFacts: [
          `Revenue: ${settings.defaultCurrency} ${metrics.revenue}`,
          `Estimated Profit: ${settings.defaultCurrency} ${metrics.estimatedGrossProfit ?? "N/A"}`,
          `Estimated Valuation: ${settings.defaultCurrency} ${metrics.estimatedInventoryValuation}`,
          `Cost Data Status: ${metrics.costDataStatus}`,
        ],
      });
    }

    // D. "Emails waiting for approval" / "draft emails"
    if (
      promptLower.includes("email") ||
      promptLower.includes("draft") ||
      promptLower.includes("pending approval")
    ) {
      if (pendingDrafts.length === 0) {
        return NextResponse.json({
          answer: "There are currently no supplier restock email drafts awaiting approval.",
          sourceType: "database",
          groundedFacts: ["0 pending drafts in queue"],
        });
      }

      const draftList = pendingDrafts
        .map(
          (d) =>
            `• **To:** ${d.recipientName} (${d.recipientEmail})\n  **Subject:** "${d.subject}"\n  **Reason:** ${d.reason}`
        )
        .join("\n\n");

      return NextResponse.json({
        answer: `You have **${pendingDrafts.length} restock email draft(s)** awaiting review and approval:\n\n${draftList}\n\n*Important: In accordance with our security policy, no email is ever dispatched to suppliers without your explicit approval.*`,
        sourceType: "database",
        groundedFacts: [
          `${pendingDrafts.length} supplier drafts pending in review queue`,
          "Explicit approval required before sending",
        ],
        suggestedAction: {
          type: "review_email",
          label: "Review and Approve Emails",
          targetRoute: "/suppliers",
          requiresConfirmation: true,
        },
      });
    }

    // E. External Research / TinyFish Routing (Alternative suppliers, market info, etc.)
    if (
      promptLower.includes("find suppliers for") ||
      promptLower.includes("alternative supplier") ||
      promptLower.includes("research supplier") ||
      promptLower.includes("market trend")
    ) {
      const apiKey = process.env.TINYFISH_API_KEY;
      if (!apiKey || apiKey === "your_tinyfish_api_key_here") {
        return NextResponse.json({
          answer:
            "Live web research is unavailable because `TINYFISH_API_KEY` is not configured in your server environment (.env.local). Please set your TinyFish key to enable live supplier and market discovery. No fabricated results are returned.",
          sourceType: "tinyfish_web",
          groundedFacts: ["TINYFISH_API_KEY unconfigured; mocked data refused."],
        });
      }

      try {
        const alternatives = await researchProductAlternativesWithTinyFish(
          prompt.replace(/find suppliers for|alternative suppliers? for|research/gi, "").trim(),
          settings.businessCategory || "Eco Packaging & Manufacturing",
          settings.country || "India",
          apiKey
        );

        if (alternatives.length > 0) {
          const items = alternatives
            .map(
              (a) =>
                `• **${a.supplierName}** — ${a.productName}\n  Estimated Price/MOQ: ${a.pricingOrMoqSnippet || "Request quote"}\n  [Source Link](${a.sourceUrl})`
            )
            .join("\n\n");

          return NextResponse.json({
            answer: `Here are external supplier candidates discovered live via TinyFish Web Intelligence:\n\n${items}\n\n*Important: External web research is distinct from your internal records and cannot automatically alter inventory or dispatch purchase commitments without your review.*`,
            sourceType: "tinyfish_web",
            groundedFacts: [
              "Retrieved live from public web sources via TinyFish",
              `Region: ${settings.country}`,
            ],
            externalSources: alternatives.map((a) => ({
              title: `${a.supplierName}: ${a.productName}`,
              url: a.sourceUrl,
            })),
          });
        } else {
          return NextResponse.json({
            answer: "TinyFish live search completed but returned no public supplier listings matching your specific query. Please try broadening your search criteria.",
            sourceType: "tinyfish_web",
            groundedFacts: ["0 external supplier matches found on live web"],
          });
        }
      } catch (err: any) {
        const apiErr = err as TinyFishApiError;
        return NextResponse.json({
          answer: `TinyFish live research request failed (${apiErr.code || "UPSTREAM_ERROR"}: ${apiErr.message || err.message}). No fabricated data returned.`,
          sourceType: "tinyfish_web",
          groundedFacts: [`Upstream API failure: ${apiErr.code || "ERROR"}`],
        });
      }
    }

    // 3. Fallback to Gemini LLM Synthesis if GEMINI_API_KEY is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const systemContext = `
You are the Oppora 2.0 AI Startup Operations Copilot for a founder.
Company: "${settings.companyName}" (${settings.businessCategory}, ${settings.country}).
Default Currency: ${settings.defaultCurrency}.

Here is the current authentic grounded database snapshot for this authenticated business:
- Total Products Tracked: ${metrics.totalProductsTracked}
- Products Below Reorder Threshold: ${metrics.lowStockProductsCount} (${lowStockProducts.map((p) => `${p.name}: ${p.currentStock}/${p.reorderThreshold}`).join(", ") || "None"})
- Recent 30-Day Revenue: ${settings.defaultCurrency} ${metrics.revenue}
- Estimated Gross Profit: ${settings.defaultCurrency} ${metrics.estimatedGrossProfit ?? "N/A"}
- Estimated Inventory Valuation: ${settings.defaultCurrency} ${metrics.estimatedInventoryValuation}
- Pending Supplier Email Drafts: ${pendingDrafts.length}

RULES:
1. Ground your answers strictly in the operational data provided above.
2. If discussing numbers, distinguish clearly between revenue, estimated profit, and inventory valuation.
3. If the user asks to send emails, update stock, or perform write actions, state that actions require their explicit confirmation.
4. Keep tone professional, concise, and operational.
`;

        // Support modern Gemini Flash models (gemini-3.5-flash, gemini-2.5-flash, gemini-1.5-flash)
        const candidateModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
        let generationResult: any = null;
        let activeModelName = "gemini-3.5-flash";

        for (const mName of candidateModels) {
          try {
            const candidate = genAI.getGenerativeModel({ model: mName });
            generationResult = await candidate.generateContent(`${systemContext}\n\nUser Question: ${prompt}`);
            activeModelName = mName;
            break;
          } catch {
            // Try next model candidate
          }
        }

        if (generationResult) {
          const text = generationResult.response.text();
          return NextResponse.json({
            answer: text,
            sourceType: "synthesis",
            groundedFacts: [
              `Synthesized with ${activeModelName} grounded on ${metrics.totalProductsTracked} inventory records and ${allSales.length} sales records.`,
            ],
          });
        }
      } catch (err: any) {
        // Fall through to default guidance if Gemini encounters quota or network error
      }
    }

    // 4. Default helpful guidance
    return NextResponse.json({
      answer: `I can assist you with your startup operations. Here are questions you can ask me:\n\n• **"Which products need restocking?"**\n• **"Which products sold the most this month?"**\n• **"What is the estimated gross profit for the past 30 days?"**\n• **"Which supplier emails need approval?"**\n• **"Find suppliers for biodegradable bubble wrap in India"** (via TinyFish)\n• **"Find funding programs suitable for my startup"** (via Opportunities)\n\nYou can also click any of the suggested actions below.`,
      sourceType: "database",
      groundedFacts: [
        `Operational database connected: ${metrics.totalProductsTracked} products, ${allSales.length} recent sales`,
      ],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to process assistant query", code: err.code || "ASSISTANT_ERROR", details: err.details },
      { status }
    );
  }
}
