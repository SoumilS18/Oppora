import { Product, Supplier, Sale, RestockOrder, ReorderRecommendation } from "@/types/operations";
import { round2 } from "./store";

export interface ReorderEngineInput {
  product: Product;
  supplier?: Supplier | null;
  sales: Sale[];
  openOrders?: RestockOrder[];
  windowDays?: number;
  now?: Date;
}

/**
 * Explainable Reorder Recommendation Engine
 * Implements: Reorder Point = average daily sales × supplier lead time + safety stock
 * Calculates days remaining = current available stock / average daily sales
 * Accounts for outstanding purchase orders to avoid duplicate ordering.
 * Fully explainable in plain language without fabricating estimates.
 */
export function calculateReorderRecommendation(input: ReorderEngineInput): ReorderRecommendation {
  const { product, supplier, sales, openOrders = [], windowDays = 30 } = input;
  const now = input.now || new Date();
  const effectiveWindowDays = Math.max(1, windowDays);
  const windowStartMs = now.getTime() - effectiveWindowDays * 24 * 60 * 60 * 1000;

  // 1. Identify completed sales in the analysis window
  const completedSalesInWindow = sales.filter((s) => {
    if (s.status !== "completed") return false;
    const saleTime = new Date(s.saleDate).getTime();
    return !isNaN(saleTime) && saleTime >= windowStartMs && saleTime <= now.getTime();
  });

  // Calculate total units sold of this product
  let totalUnitsSoldInWindow = 0;
  for (const sale of completedSalesInWindow) {
    for (const item of sale.items) {
      if (item.productId === product.id) {
        totalUnitsSoldInWindow += item.quantity;
      }
    }
  }

  // Check if there are ANY historical sales ever recorded for this product across all time
  const totalLifetimeSales = sales.reduce((acc, sale) => {
    if (sale.status !== "completed") return acc;
    const item = sale.items.find((i) => i.productId === product.id);
    return acc + (item ? item.quantity : 0);
  }, 0);

  // 2. Assess Sales History & Daily Velocity
  const hasSufficientSalesHistory = totalUnitsSoldInWindow > 0 || totalLifetimeSales > 0;
  let averageDailySales: number | null = null;
  let daysRemaining: number | null = null;

  if (hasSufficientSalesHistory) {
    averageDailySales = round2(totalUnitsSoldInWindow / effectiveWindowDays);
    if (averageDailySales > 0) {
      // Avoid division by zero
      daysRemaining = round2(product.currentStock / averageDailySales);
    } else {
      // Product had historical sales, but 0 in current window
      daysRemaining = 999; // Depletion rate is currently flat
    }
  }

  // 3. Inspect Outstanding Purchase Orders for this product
  let outstandingPOQuantity = 0;
  const outstandingPODetails: string[] = [];

  for (const order of openOrders) {
    if (order.status === "received" || order.status === "cancelled") continue;
    for (const item of order.items) {
      if (item.productId === product.id) {
        const remaining = Math.max(0, item.quantityRequested - (item.quantityReceived || 0));
        if (remaining > 0) {
          outstandingPOQuantity = round2(outstandingPOQuantity + remaining);
          const eta = order.expectedDeliveryDate
            ? ` (ETA: ${new Date(order.expectedDeliveryDate).toLocaleDateString()})`
            : "";
          outstandingPODetails.push(
            `${order.orderNumber}: ${remaining} ${product.unitOfMeasure} pending from ${order.supplierName}${eta}`
          );
        }
      }
    }
  }

  const effectiveStock = round2(product.currentStock + outstandingPOQuantity);
  const safetyStock = product.reorderThreshold;

  // 4. Evaluate Lead Time & Reorder Point
  const leadTimeDays = supplier?.leadTimeDays ?? 0;
  const hasSupplier = Boolean(supplier || product.preferredSupplierId);
  const hasValidLeadTime = hasSupplier && leadTimeDays > 0;

  let leadTimeDemand: number | null = null;
  let calculatedReorderPoint: number | null = null;
  let isImminentStockout = false;
  let dataStatus: "complete" | "insufficient_history" | "missing_lead_time" | "unassigned_supplier" = "complete";
  let statusMessage = "Reorder point calibrated";
  let plainLanguageExplanation = "";
  let setupAction: { label: string; url: string } | undefined = undefined;

  // Case A: Missing supplier
  if (!hasSupplier) {
    dataStatus = "unassigned_supplier";
    statusMessage = "Supplier not assigned";
    plainLanguageExplanation = `No preferred supplier is assigned to ${product.name} (SKU: ${product.sku}). Reorder point cannot compute lead-time demand without supplier parameters. Using configured threshold (${product.reorderThreshold} ${product.unitOfMeasure}).`;
    setupAction = {
      label: "Assign Supplier in Inventory",
      url: `/inventory?productId=${product.id}`,
    };
  }
  // Case B: Missing lead time on supplier
  else if (!hasValidLeadTime) {
    dataStatus = "missing_lead_time";
    statusMessage = "Lead time not configured";
    const sName = supplier?.name || "Supplier";
    plainLanguageExplanation = `Supplier ${sName} does not have an expected delivery lead time configured. To prevent stockouts, define standard fulfillment lead time in days. Defaulting to fixed threshold (${product.reorderThreshold} ${product.unitOfMeasure}).`;
    setupAction = {
      label: "Set Supplier Lead Time",
      url: supplier ? `/suppliers?editSupplierId=${supplier.id}` : "/suppliers",
    };
  }
  // Case C: Insufficient sales history
  else if (!hasSufficientSalesHistory) {
    dataStatus = "insufficient_history";
    statusMessage = "Insufficient sales history";
    plainLanguageExplanation = `No sales records found for ${product.name} across the ${effectiveWindowDays}-day analysis window. Empirical reorder point requires transaction velocity. Relying on default safety threshold (${product.reorderThreshold} ${product.unitOfMeasure}) until sales are recorded.`;
    setupAction = {
      label: "Record Sale Transaction",
      url: "/sales",
    };
  }
  // Case D: Complete data
  else {
    dataStatus = "complete";
    leadTimeDemand = round2((averageDailySales || 0) * leadTimeDays);
    calculatedReorderPoint = Math.ceil(leadTimeDemand + safetyStock);

    if (daysRemaining !== null && daysRemaining < leadTimeDays) {
      isImminentStockout = true;
    }

    const velocityStr = `${averageDailySales} ${product.unitOfMeasure}/day`;
    plainLanguageExplanation =
      `Average daily sales (${velocityStr} over ${effectiveWindowDays}d) × ` +
      `Supplier lead time (${leadTimeDays}d) + ` +
      `Safety stock (${safetyStock} ${product.unitOfMeasure}) = ` +
      `Reorder point of ${calculatedReorderPoint} ${product.unitOfMeasure}. ` +
      `Current stock: ${product.currentStock} ${product.unitOfMeasure} ` +
      `(~${daysRemaining !== 999 ? daysRemaining + " days" : "stable"} remaining).`;

    if (outstandingPOQuantity > 0) {
      plainLanguageExplanation += ` Outstanding purchase orders (${outstandingPOQuantity} ${product.unitOfMeasure}) are already scheduled for receipt.`;
    }
  }

  // 5. Determine Net Shortfall and Recommended Order Quantity
  const targetThreshold = calculatedReorderPoint !== null ? calculatedReorderPoint : product.reorderThreshold;
  const netShortfall = Math.max(0, targetThreshold - effectiveStock);

  let recommendedOrderQuantity = 0;
  if (effectiveStock <= targetThreshold) {
    recommendedOrderQuantity = Math.max(product.preferredReorderQuantity, netShortfall);
  }

  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.currentStock,
    unitOfMeasure: product.unitOfMeasure,
    supplierId: supplier?.id || product.preferredSupplierId || null,
    supplierName: supplier?.name || product.supplierName || "Unassigned",
    supplierLeadTimeDays: leadTimeDays,
    safetyStock,
    averageDailySales,
    salesWindowDays: effectiveWindowDays,
    daysRemaining,
    leadTimeDemand,
    calculatedReorderPoint,
    configuredReorderThreshold: product.reorderThreshold,
    outstandingPOQuantity,
    outstandingPODetails,
    netShortfall,
    recommendedOrderQuantity,
    isImminentStockout,
    dataStatus,
    statusMessage,
    plainLanguageExplanation,
    setupAction,
  };
}
