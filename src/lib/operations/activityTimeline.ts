import {
  ActivityEvent,
  ActivityType,
  ActivityStatus,
  Sale,
  StockMovement,
  SupplierEmailDraft,
  RestockOrder,
  Product,
} from "@/types/operations";

export interface ActivityAggregationInput {
  sales: Sale[];
  movements: StockMovement[];
  drafts: SupplierEmailDraft[];
  orders?: RestockOrder[];
  products?: Product[];
  savedOpportunities?: any[];
  explicitEvents?: ActivityEvent[];
  currencySymbol?: string;
}

export function formatRelativeTime(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    if (isNaN(diffMs)) return "Recently";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

/**
 * Aggregates unified operational activity timeline directly from persisted audit records.
 * Categorizes strictly into: proposed, approved, executed, failed.
 * Zero fabrication of historical actions.
 */
export function buildActivityTimeline(input: ActivityAggregationInput): ActivityEvent[] {
  const {
    sales = [],
    movements = [],
    drafts = [],
    orders = [],
    savedOpportunities = [],
    explicitEvents = [],
    currencySymbol = "₹",
  } = input;

  const events: ActivityEvent[] = [];

  // 1. Sales Recorded (Executed)
  for (const s of sales) {
    if (s.status === "completed") {
      events.push({
        id: `act-sale-${s.id}`,
        type: "sale_recorded",
        status: "executed",
        title: `Sale Recorded #${s.saleNumber}`,
        description: `Logged transaction of ${currencySymbol} ${s.totalAmount.toLocaleString()} (${s.items.length} line items) via ${s.paymentMethod}.`,
        entityType: "sale",
        entityId: s.id,
        timestamp: s.saleDate || s.createdAt || new Date().toISOString(),
        relativeTime: formatRelativeTime(s.saleDate || s.createdAt || new Date().toISOString()),
        link: `/sales`,
        metadata: {
          saleNumber: s.saleNumber,
          totalAmount: s.totalAmount,
          itemCount: s.items.length,
        },
      });
    }
  }

  // 2. Stock Movements (Executed: Receipts, Adjustments, Damage Write-offs, Returns)
  for (const m of movements) {
    if (m.movementType === "stock_receipt") {
      events.push({
        id: `act-mov-${m.id}`,
        type: "stock_received",
        status: "executed",
        title: `Stock Received: +${m.quantityChange} units`,
        description: `${m.productName || "Product"} received into inventory. Reason: ${m.reason}. New balance: ${m.quantityAfter}.`,
        entityType: "stock_movement",
        entityId: m.id,
        timestamp: m.createdAt,
        relativeTime: formatRelativeTime(m.createdAt),
        link: `/inventory?productId=${m.productId}`,
        metadata: { productId: m.productId, quantityChange: m.quantityChange },
      });
    } else if (m.movementType === "manual_adjustment" || m.movementType === "damage_writeoff" || m.movementType === "return") {
      events.push({
        id: `act-mov-${m.id}`,
        type: "stock_adjusted",
        status: "executed",
        title: `Stock Adjusted: ${m.quantityChange > 0 ? "+" + m.quantityChange : m.quantityChange} units`,
        description: `${m.productName || "Product"} adjusted. Reason: ${m.reason}. Balance: ${m.quantityAfter}.`,
        entityType: "stock_movement",
        entityId: m.id,
        timestamp: m.createdAt,
        relativeTime: formatRelativeTime(m.createdAt),
        link: `/inventory?productId=${m.productId}`,
        metadata: { productId: m.productId, reason: m.reason },
      });
    }
  }

  // 3. Supplier Email Drafts (Proposed, Approved, Executed, Failed)
  for (const d of drafts) {
    // A. Proposed draft created
    events.push({
      id: `act-draft-created-${d.id}`,
      type: "supplier_draft_created",
      status: "proposed",
      title: `Supplier Restock Draft Created`,
      description: `Inquiry for ${d.suggestedQuantity} units prepared for ${d.recipientName} (${d.subject}). Awaiting founder approval.`,
      entityType: "email_draft",
      entityId: d.id,
      timestamp: d.createdAt || new Date().toISOString(),
      relativeTime: formatRelativeTime(d.createdAt || new Date().toISOString()),
      link: `/suppliers?tab=drafts&draftId=${d.id}`,
      metadata: { recipientName: d.recipientName, suggestedQuantity: d.suggestedQuantity },
    });

    // B. Approved by user
    if (d.status === "approved" || d.status === "sending" || d.status === "sent") {
      events.push({
        id: `act-draft-approved-${d.id}`,
        type: "email_approved",
        status: "approved",
        title: `Supplier Restock Draft Approved`,
        description: `Founder approved restock communication to ${d.recipientName}. Queued for provider dispatch.`,
        entityType: "email_draft",
        entityId: d.id,
        timestamp: d.updatedAt || d.createdAt || new Date().toISOString(),
        relativeTime: formatRelativeTime(d.updatedAt || d.createdAt || new Date().toISOString()),
        link: `/suppliers?tab=drafts&draftId=${d.id}`,
      });
    }

    // C. Sent / Dispatched (Accepted by provider)
    if (d.status === "sent" && d.sentAt) {
      events.push({
        id: `act-draft-sent-${d.id}`,
        type: "email_sent",
        status: "executed",
        title: `Restock Email Accepted by Provider`,
        description: `Delivered to ${d.recipientEmail}. Provider reference ID: ${d.providerMessageId || "Accepted"}.`,
        entityType: "email_draft",
        entityId: d.id,
        timestamp: d.sentAt,
        relativeTime: formatRelativeTime(d.sentAt),
        link: `/suppliers?tab=drafts&draftId=${d.id}`,
      });
    }

    // D. Failed email dispatch
    if (d.status === "failed" || (d.errorMessage && d.status !== "sent")) {
      events.push({
        id: `act-draft-failed-${d.id}`,
        type: "email_failed",
        status: "failed",
        title: `Email Delivery Failed`,
        description: `Dispatch to ${d.recipientEmail} failed: ${d.errorMessage || "Delivery error"}. Draft preserved for retry.`,
        entityType: "email_draft",
        entityId: d.id,
        timestamp: d.updatedAt || new Date().toISOString(),
        relativeTime: formatRelativeTime(d.updatedAt || new Date().toISOString()),
        link: `/suppliers?tab=drafts&draftId=${d.id}`,
      });
    }
  }

  // 4. Purchase Orders Created (Proposed / Executed)
  for (const o of orders) {
    events.push({
      id: `act-po-${o.id}`,
      type: "purchase_order_created",
      status: o.status === "draft" ? "proposed" : "executed",
      title: `Purchase Order ${o.orderNumber}`,
      description: `Order issued to ${o.supplierName} (${o.items.length} items, ${currencySymbol} ${o.totalEstimatedCost.toLocaleString()}). Status: ${o.status}.`,
      entityType: "purchase_order",
      entityId: o.id,
      timestamp: o.createdAt || new Date().toISOString(),
      relativeTime: formatRelativeTime(o.createdAt || new Date().toISOString()),
      link: `/suppliers?tab=orders&orderId=${o.id}`,
    });
  }

  // 5. Saved Opportunities (Executed)
  for (const opp of savedOpportunities) {
    const oppName = opp.opportunity_snapshot?.name || opp.name || "Opportunity";
    const oppProvider = opp.opportunity_snapshot?.provider || opp.provider || "Provider";
    const oppDate = opp.created_at || new Date().toISOString();
    events.push({
      id: `act-opp-saved-${opp.id || opp.opportunity_id}`,
      type: "opportunity_saved",
      status: "executed",
      title: `Funding Opportunity Saved`,
      description: `Bookmarked "${oppName}" from ${oppProvider} to application tracking watchlist.`,
      entityType: "opportunity",
      entityId: opp.opportunity_id || opp.id,
      timestamp: oppDate,
      relativeTime: formatRelativeTime(oppDate),
      link: `/opportunities?tab=saved&opportunityId=${opp.opportunity_id || opp.id}`,
    });
  }

  // 6. Explicit System/Integration Events
  for (const ev of explicitEvents) {
    events.push(ev);
  }

  // Sort strictly by timestamp descending
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
