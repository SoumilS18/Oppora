import {
  Product,
  Supplier,
  Sale,
  RestockOrder,
  SupplierEmailDraft,
  BusinessSettings,
  BusinessAction,
  ActionSummary,
  ReorderRecommendation,
} from "@/types/operations";
import { calculateReorderRecommendation } from "./reorderEngine";
import { formatRelativeTime } from "./activityTimeline";

export interface ActionCenterInput {
  products: Product[];
  suppliers: Supplier[];
  sales: Sale[];
  drafts: SupplierEmailDraft[];
  orders: RestockOrder[];
  savedOpportunities?: any[];
  settings?: BusinessSettings;
  systemConfig?: {
    isSupabaseConfigured: boolean;
    isEmailConfigured: boolean;
    storageMode: "supabase" | "memory";
    dbError?: string | null;
  };
  now?: Date;
}

/**
 * Prioritized Business Action Centre Generator
 * Evaluates real persisted business records to generate explainable, prioritized,
 * and directly actionable guidance for founders.
 */
export function generateActionCenter(input: ActionCenterInput): {
  actions: BusinessAction[];
  summary: ActionSummary;
  recommendations: ReorderRecommendation[];
} {
  const {
    products = [],
    suppliers = [],
    sales = [],
    drafts = [],
    orders = [],
    savedOpportunities = [],
    systemConfig = {
      isSupabaseConfigured: false,
      isEmailConfigured: false,
      storageMode: "memory",
    },
  } = input;

  const now = input.now || new Date();
  const actions: BusinessAction[] = [];
  const recommendations: ReorderRecommendation[] = [];

  const supplierMap = new Map<string, Supplier>();
  for (const s of suppliers) {
    supplierMap.set(s.id, s);
  }

  // ============================================================================
  // 1 & 2. INVENTORY HEALTH, REORDER POINTS & LEAD-TIME STOCKOUTS
  // ============================================================================
  for (const product of products) {
    if (!product.isActive) continue;

    const supplier = product.preferredSupplierId ? supplierMap.get(product.preferredSupplierId) : null;
    const rec = calculateReorderRecommendation({
      product,
      supplier,
      sales,
      openOrders: orders,
      windowDays: 30,
      now,
    });
    recommendations.push(rec);

    const targetThreshold = rec.calculatedReorderPoint !== null ? rec.calculatedReorderPoint : product.reorderThreshold;
    const effectiveStock = product.currentStock + rec.outstandingPOQuantity;

    // Check A: Lead-Time Stockout Risk (Insufficient stock to survive supplier lead time)
    if (
      rec.isImminentStockout &&
      rec.daysRemaining !== null &&
      rec.supplierLeadTimeDays &&
      rec.supplierLeadTimeDays > 0
    ) {
      const daysShort = Math.max(1, Math.round(rec.supplierLeadTimeDays - rec.daysRemaining));
      actions.push({
        id: `act-leadtime-${product.id}`,
        category: "lead_time_stockout",
        severity: "critical",
        title: `Imminent Stockout: ${product.name}`,
        explanation: `At current sales velocity (${rec.averageDailySales} ${product.unitOfMeasure}/day), available stock (${product.currentStock} ${product.unitOfMeasure}) will deplete in ~${rec.daysRemaining} days. Supplier ${rec.supplierName} requires ${rec.supplierLeadTimeDays} days for delivery, resulting in an expected ${daysShort}-day stockout gap unless expedited.`,
        supportingData: {
          calculationText: rec.plainLanguageExplanation,
          metrics: {
            currentStock: product.currentStock,
            daysRemaining: rec.daysRemaining,
            supplierLeadTime: rec.supplierLeadTimeDays,
            averageDailySales: rec.averageDailySales,
            outstandingPOQuantity: rec.outstandingPOQuantity,
          },
          breakdown: [
            `Current Inventory: ${product.currentStock} ${product.unitOfMeasure}`,
            `Depletion Velocity: ${rec.averageDailySales} ${product.unitOfMeasure}/day (30-day window)`,
            `Days of Stock Remaining: ~${rec.daysRemaining} days`,
            `Supplier Lead Time: ${rec.supplierLeadTimeDays} days (${rec.supplierName})`,
            ...(rec.outstandingPODetails || []),
          ],
        },
        recommendedNextStep: rec.outstandingPOQuantity > 0
          ? `Follow up with ${rec.supplierName} to expedite pending delivery (${rec.outstandingPOQuantity} ${product.unitOfMeasure}).`
          : `Create priority restock order of ${rec.recommendedOrderQuantity} ${product.unitOfMeasure} or approve pending draft.`,
        actionUrl: supplier ? `/suppliers?tab=orders&reorderSupplierId=${supplier.id}` : `/inventory?productId=${product.id}`,
        actionLabel: rec.outstandingPOQuantity > 0 ? "Inspect Inbound Orders" : "Initiate Restock Order",
        timestamp: product.updatedAt || now.toISOString(),
        freshnessLabel: formatRelativeTime(product.updatedAt || now.toISOString()),
        metadata: { productId: product.id, supplierId: supplier?.id },
      });
    }

    // Check B: Low Stock & Reorder Point Warnings
    else if (effectiveStock <= targetThreshold) {
      const isCompletelyOutOfStock = product.currentStock <= 0;
      const isSeverelyLow = product.currentStock <= (targetThreshold * 0.4);
      const severity = isCompletelyOutOfStock || isSeverelyLow ? "critical" : "warning";

      actions.push({
        id: `act-reorder-${product.id}`,
        category: "low_stock",
        severity,
        title: isCompletelyOutOfStock
          ? `Out of Stock: ${product.name}`
          : `Reorder Required: ${product.name}`,
        explanation: isCompletelyOutOfStock
          ? `Current available inventory is 0 ${product.unitOfMeasure}. Sales are blocked until replenishment arrives.`
          : `Current stock (${product.currentStock} ${product.unitOfMeasure}) is at or below the calibrated reorder point of ${targetThreshold} ${product.unitOfMeasure}.`,
        supportingData: {
          calculationText: rec.plainLanguageExplanation,
          metrics: {
            currentStock: product.currentStock,
            reorderPoint: targetThreshold,
            safetyStock: rec.safetyStock,
            recommendedOrderQty: rec.recommendedOrderQuantity,
            outstandingQuantity: rec.outstandingPOQuantity,
          },
          breakdown: [
            `Available Stock: ${product.currentStock} ${product.unitOfMeasure}`,
            `Reorder Point: ${targetThreshold} ${product.unitOfMeasure}`,
            `Recommended Order Volume: ${rec.recommendedOrderQuantity} ${product.unitOfMeasure}`,
            ...(rec.outstandingPODetails && rec.outstandingPODetails.length > 0
              ? [`Inbound Stock Already Scheduled: ${rec.outstandingPOQuantity} ${product.unitOfMeasure}`]
              : []),
          ],
        },
        recommendedNextStep: rec.outstandingPOQuantity >= targetThreshold
          ? `Monitor scheduled delivery (${rec.outstandingPOQuantity} ${product.unitOfMeasure}) to ensure timely arrival.`
          : `Submit restock inquiry for ${rec.recommendedOrderQuantity} ${product.unitOfMeasure} to ${rec.supplierName}.`,
        actionUrl: supplier ? `/suppliers?tab=drafts` : `/inventory?productId=${product.id}`,
        actionLabel: supplier ? "Review Restock Draft" : "Assign Supplier",
        timestamp: product.updatedAt || now.toISOString(),
        freshnessLabel: formatRelativeTime(product.updatedAt || now.toISOString()),
        metadata: { productId: product.id, supplierId: supplier?.id },
      });
    }
  }

  // ============================================================================
  // 3. SUPPLIER EMAILS AWAITING APPROVAL
  // ============================================================================
  for (const draft of drafts) {
    if (draft.status === "draft" || draft.status === "approved") {
      actions.push({
        id: `act-email-draft-${draft.id}`,
        category: "email_draft_approval",
        severity: "warning",
        title: `Supplier Restock Draft Awaiting Approval`,
        explanation: `An automated restock inquiry to ${draft.recipientName} for ${draft.suggestedQuantity} units requires your explicit approval before dispatch. Oppora never sends supplier emails autonomously.`,
        supportingData: {
          calculationText: `Recipient: ${draft.recipientName} (${draft.recipientEmail}) &bull; Subject: "${draft.subject}" &bull; Trigger reason: ${draft.reason}`,
          metrics: {
            recipientEmail: draft.recipientEmail,
            suggestedQuantity: draft.suggestedQuantity,
            status: draft.status,
          },
          breakdown: [
            `Supplier: ${draft.recipientName} (${draft.recipientEmail})`,
            `Subject: ${draft.subject}`,
            `Inquiry Volume: ${draft.suggestedQuantity} units`,
            `Status: ${draft.status === "approved" ? "Approved, ready to dispatch" : "Draft, awaiting review"}`,
          ],
        },
        recommendedNextStep: `Review draft text and supplier contact details, then click "Approve & Send".`,
        actionUrl: `/suppliers?tab=drafts&draftId=${draft.id}`,
        actionLabel: "Review & Dispatch Draft",
        timestamp: draft.updatedAt || draft.createdAt || now.toISOString(),
        freshnessLabel: formatRelativeTime(draft.updatedAt || draft.createdAt || now.toISOString()),
        metadata: { draftId: draft.id, supplierId: draft.supplierId || undefined },
      });
    }
  }

  // ============================================================================
  // 4. OVERDUE PURCHASE ORDERS (NOT RECEIVED BY EXPECTED DATE)
  // ============================================================================
  for (const order of orders) {
    if (order.status === "received" || order.status === "cancelled") continue;

    if (order.expectedDeliveryDate) {
      const expectedTime = new Date(order.expectedDeliveryDate).getTime();
      if (!isNaN(expectedTime) && expectedTime < now.getTime()) {
        const daysOverdue = Math.max(1, Math.ceil((now.getTime() - expectedTime) / (1000 * 60 * 60 * 24)));
        const severity = daysOverdue > 2 ? "critical" : "warning";

        actions.push({
          id: `act-overdue-po-${order.id}`,
          category: "overdue_purchase_order",
          severity,
          title: `Overdue Purchase Order: ${order.orderNumber}`,
          explanation: `Purchase Order ${order.orderNumber} from ${order.supplierName} was scheduled for delivery on ${new Date(order.expectedDeliveryDate).toLocaleDateString()} (${daysOverdue} days overdue), but physical stock receipt has not been recorded.`,
          supportingData: {
            calculationText: `Order #${order.orderNumber} &bull; Expected: ${new Date(order.expectedDeliveryDate).toLocaleDateString()} &bull; Delay: ${daysOverdue} days &bull; Current status: ${order.status}`,
            metrics: {
              orderNumber: order.orderNumber,
              supplierName: order.supplierName,
              daysOverdue,
              totalCost: order.totalEstimatedCost,
              itemCount: order.items.length,
            },
            breakdown: [
              `Supplier: ${order.supplierName}`,
              `Expected Date: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`,
              `Days Overdue: ${daysOverdue} day(s)`,
              `Pending Items: ${order.items.map((i) => `${i.productName} (${i.quantityRequested - i.quantityReceived} remaining)`).join(", ")}`,
            ],
          },
          recommendedNextStep: `Contact ${order.supplierName} for tracking status or record received quantities in Oppora.`,
          actionUrl: `/suppliers?tab=orders&orderId=${order.id}`,
          actionLabel: "Receive Stock / Track PO",
          timestamp: order.updatedAt || order.createdAt || now.toISOString(),
          freshnessLabel: formatRelativeTime(order.updatedAt || order.createdAt || now.toISOString()),
          metadata: { orderId: order.id, supplierId: order.supplierId || undefined },
        });
      }
    }
  }

  // ============================================================================
  // 5. UNUSUALLY LOW OR DECLINING SALES (ONLY WITH SUFFICIENT HISTORICAL DATA)
  // ============================================================================
  // Rule: Only analyze when sufficient history exists (at least 3 completed sales transactions across at least 14 days)
  const completedSales = sales.filter((s) => s.status === "completed");
  const salesSpanDays = completedSales.length >= 2
    ? Math.max(1, Math.ceil(
        (now.getTime() - Math.min(...completedSales.map((s) => new Date(s.saleDate).getTime()))) / (1000 * 60 * 60 * 24)
      ))
    : 0;

  if (completedSales.length >= 3 && salesSpanDays >= 14) {
    const recentWindowDays = 14;
    const recentStartMs = now.getTime() - recentWindowDays * 24 * 60 * 60 * 1000;
    const prevStartMs = now.getTime() - recentWindowDays * 2 * 24 * 60 * 60 * 1000;

    for (const prod of products) {
      if (!prod.isActive || prod.currentStock <= 0) continue;

      let recentUnits = 0;
      let prevUnits = 0;

      for (const sale of completedSales) {
        const t = new Date(sale.saleDate).getTime();
        for (const item of sale.items) {
          if (item.productId === prod.id) {
            if (t >= recentStartMs && t <= now.getTime()) {
              recentUnits += item.quantity;
            } else if (t >= prevStartMs && t < recentStartMs) {
              prevUnits += item.quantity;
            }
          }
        }
      }

      // Flag only if previous period had steady movement (>= 10 units) and recent dropped by >= 60%
      if (prevUnits >= 10 && recentUnits <= prevUnits * 0.4) {
        const dropPct = Math.round(((prevUnits - recentUnits) / prevUnits) * 100);
        actions.push({
          id: `act-declining-sales-${prod.id}`,
          category: "declining_sales",
          severity: "info",
          title: `Declining Sales Velocity: ${prod.name}`,
          explanation: `Sales volume dropped ${dropPct}% over the last 14 days (${recentUnits} units sold vs ${prevUnits} in previous 14d) despite maintaining ${prod.currentStock} ${prod.unitOfMeasure} in stock.`,
          supportingData: {
            calculationText: `Previous 14d: ${prevUnits} units &bull; Recent 14d: ${recentUnits} units &bull; Decline: -${dropPct}% &bull; Current Inventory: ${prod.currentStock}`,
            metrics: {
              previousPeriodUnits: prevUnits,
              recentPeriodUnits: recentUnits,
              percentageDrop: dropPct,
              currentStock: prod.currentStock,
            },
            breakdown: [
              `Recent 14-day units sold: ${recentUnits} ${prod.unitOfMeasure}`,
              `Previous 14-day units sold: ${prevUnits} ${prod.unitOfMeasure}`,
              `Observed velocity contraction: -${dropPct}%`,
              `Idle stock carrying: ${prod.currentStock} ${prod.unitOfMeasure}`,
            ],
          },
          recommendedNextStep: `Review retail pricing, marketing channel attribution, or consider bundle promotions.`,
          actionUrl: `/sales?productId=${prod.id}`,
          actionLabel: "Analyze Sales History",
          timestamp: prod.updatedAt || now.toISOString(),
          freshnessLabel: formatRelativeTime(prod.updatedAt || now.toISOString()),
          metadata: { productId: prod.id },
        });
      }
    }
  }

  // ============================================================================
  // 6. FUNDING OPPORTUNITIES WITH APPROACHING DEADLINES
  // ============================================================================
  for (const item of savedOpportunities) {
    const opp = item.opportunity_snapshot || item;
    if (!opp || !opp.applicationDeadline) continue;

    const deadlineTime = new Date(opp.applicationDeadline).getTime();
    if (!isNaN(deadlineTime) && deadlineTime > now.getTime() && !opp.isExpired) {
      const daysUntilDeadline = Math.max(0, Math.ceil((deadlineTime - now.getTime()) / (1000 * 60 * 60 * 24)));

      if (daysUntilDeadline <= 30) {
        const severity = daysUntilDeadline <= 7 ? "critical" : daysUntilDeadline <= 14 ? "warning" : "info";
        const oppId = item.opportunity_id || opp.id || "opp";

        actions.push({
          id: `act-funding-deadline-${oppId}`,
          category: "funding_deadline",
          severity,
          title: `Funding Deadline Approaching: ${opp.name}`,
          explanation: `Application deadline for ${opp.provider}'s ${opp.fundingAmountOrBenefits} grant is closing on ${opp.deadlineLabel || new Date(opp.applicationDeadline).toLocaleDateString()} (${daysUntilDeadline} days remaining).`,
          supportingData: {
            calculationText: `Provider: ${opp.provider} &bull; Deadline: ${opp.deadlineLabel} &bull; Days remaining: ${daysUntilDeadline} &bull; Category: ${opp.category}`,
            metrics: {
              deadline: opp.deadlineLabel,
              daysRemaining: daysUntilDeadline,
              category: opp.category,
            },
            breakdown: [
              `Program: ${opp.name}`,
              `Grantor: ${opp.provider}`,
              `Funding: ${opp.fundingAmountOrBenefits}`,
              `Final Cutoff: ${opp.deadlineLabel} (${daysUntilDeadline} days left)`,
            ],
          },
          recommendedNextStep: `Complete remaining items in your application readiness checklist before submission.`,
          actionUrl: `/opportunities?tab=saved&opportunityId=${oppId}`,
          actionLabel: "Open Application Checklist",
          timestamp: item.created_at || now.toISOString(),
          freshnessLabel: formatRelativeTime(item.created_at || now.toISOString()),
          metadata: { opportunityId: oppId },
        });
      }
    }
  }

  // ============================================================================
  // 7. INTEGRATION FAILURES OR INCOMPLETE BUSINESS SETUP
  // ============================================================================
  // Check A: Database Unavailable / Error
  if (systemConfig.dbError) {
    actions.push({
      id: "act-setup-db-error",
      category: "integration_setup",
      severity: "critical",
      title: "Database Connection Failure",
      explanation: `Oppora cannot persist records to Supabase: ${systemConfig.dbError}. Operating in offline degraded mode.`,
      supportingData: {
        calculationText: `Database Error: ${systemConfig.dbError}`,
        metrics: { error: systemConfig.dbError },
      },
      recommendedNextStep: "Verify Supabase connection parameters and database credentials in .env.local.",
      actionUrl: "/settings",
      actionLabel: "Review Database Settings",
      timestamp: now.toISOString(),
      freshnessLabel: "Active Error",
    });
  }

  // Check B: Products missing preferred supplier
  const productsWithoutSupplier = products.filter((p) => p.isActive && !p.preferredSupplierId);
  if (productsWithoutSupplier.length > 0) {
    actions.push({
      id: "act-setup-missing-suppliers",
      category: "integration_setup",
      severity: "warning",
      title: `Missing Supplier Assignment: ${productsWithoutSupplier.length} Product(s)`,
      explanation: `Automated reorder point calibration and restock draft preparation cannot trigger for products without an assigned supplier.`,
      supportingData: {
        calculationText: `Affected SKUs: ${productsWithoutSupplier.map((p) => p.sku).join(", ")}`,
        metrics: { affectedProductCount: productsWithoutSupplier.length },
        breakdown: productsWithoutSupplier.map((p) => `${p.name} (SKU: ${p.sku}) - No supplier assigned`),
      },
      recommendedNextStep: `Edit affected products in Inventory to link them with a supplier from your directory.`,
      actionUrl: `/inventory`,
      actionLabel: "Assign Suppliers in Inventory",
      timestamp: now.toISOString(),
      freshnessLabel: "Incomplete Setup",
    });
  }

  // Check C: Suppliers missing delivery lead time
  const suppliersWithoutLeadTime = suppliers.filter((s) => s.isActive && (!s.leadTimeDays || s.leadTimeDays <= 0));
  if (suppliersWithoutLeadTime.length > 0) {
    actions.push({
      id: "act-setup-missing-leadtime",
      category: "integration_setup",
      severity: "warning",
      title: `Missing Delivery Lead Time: ${suppliersWithoutLeadTime.length} Supplier(s)`,
      explanation: `Stockout lead-time demand calculations require valid delivery lead times (in days). Currently unconfigured for ${suppliersWithoutLeadTime.map((s) => s.name).join(", ")}.`,
      supportingData: {
        calculationText: `Suppliers needing lead time: ${suppliersWithoutLeadTime.map((s) => s.name).join(", ")}`,
        metrics: { affectedSupplierCount: suppliersWithoutLeadTime.length },
      },
      recommendedNextStep: `Configure expected fulfillment lead times in the Supplier Directory.`,
      actionUrl: `/suppliers?tab=directory`,
      actionLabel: "Set Supplier Lead Times",
      timestamp: now.toISOString(),
      freshnessLabel: "Incomplete Setup",
    });
  }

  // Check D: Transactional Email Unconfigured
  if (!systemConfig.isEmailConfigured) {
    actions.push({
      id: "act-setup-email-provider",
      category: "integration_setup",
      severity: "info",
      title: "Supplier Email Dispatch: Provider Unconfigured",
      explanation: "Oppora auto-generates restock inquiries safely into reviewable drafts. To enable direct one-click email delivery from the dashboard, configure a Resend API key.",
      supportingData: {
        calculationText: "RESEND_API_KEY is not defined in environment. Drafts are safely preserved for manual copying or offline sending.",
        metrics: { provider: "unconfigured" },
      },
      recommendedNextStep: "Add RESEND_API_KEY to your server configuration to enable transactional email delivery.",
      actionUrl: "/settings",
      actionLabel: "Configure Integration",
      timestamp: now.toISOString(),
      freshnessLabel: "Advisory",
    });
  }

  // ============================================================================
  // SORT ACTIONS BY PRIORITY
  // ============================================================================
  const severityRank: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  actions.sort((a, b) => {
    const diff = severityRank[a.severity] - severityRank[b.severity];
    if (diff !== 0) return diff;
    return new Date(b.timestamp || "").getTime() - new Date(a.timestamp || "").getTime();
  });

  const summary: ActionSummary = {
    criticalCount: actions.filter((a) => a.severity === "critical").length,
    warningCount: actions.filter((a) => a.severity === "warning").length,
    infoCount: actions.filter((a) => a.severity === "info").length,
    totalCount: actions.length,
  };

  return { actions, summary, recommendations };
}
