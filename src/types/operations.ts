import { z } from "zod";

// ==============================================================================
// 1. BUSINESS PROFILE & SETTINGS TYPES
// ==============================================================================

export const CurrencyCodeSchema = z.enum(["INR", "USD", "EUR", "GBP", "SGD", "AED"]);
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const BusinessSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  country: z.string().default("India"),
  state: z.string().default(""),
  defaultCurrency: CurrencyCodeSchema.default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  businessCategory: z.string().default("Manufacturing & Retail"),
  autoLowStockAlerts: z.boolean().default(true),
  supplierEmailAutoDraft: z.boolean().default(true),
  emailSenderName: z.string().default(""),
  replyToEmail: z.string().email().or(z.literal("")).default(""),
});

export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;

// ==============================================================================
// 2. SUPPLIER TYPES
// ==============================================================================

export const SupplierSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().default(""),
  email: z.string().email("Valid email is required"),
  phone: z.string().default(""),
  website: z.string().url().or(z.literal("")).default(""),
  leadTimeDays: z.number().int().min(0).default(7),
  minOrderQuantity: z.number().min(0).default(1),
  minOrderValue: z.number().min(0).default(0),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

export const SupplierInputSchema = SupplierSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type SupplierInput = z.infer<typeof SupplierInputSchema>;

// ==============================================================================
// 3. PRODUCT & INVENTORY TYPES
// ==============================================================================

export const ProductSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().default(""),
  category: z.string().min(1, "Category is required"),
  currentStock: z.number().min(0, "Stock cannot be negative"),
  unitOfMeasure: z.string().default("units"),
  reorderThreshold: z.number().min(0, "Threshold cannot be negative"),
  preferredReorderQuantity: z.number().min(1, "Reorder quantity must be at least 1"),
  unitCost: z.number().min(0, "Cost cannot be negative"),
  sellingPrice: z.number().min(0, "Price cannot be negative"),
  preferredSupplierId: z.string().nullable().optional(),
  storageLocation: z.string().default(""),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Derived/joined fields
  supplierName: z.string().optional(),
  isLowStock: z.boolean().optional(),
  salesVelocityPerDay: z.number().optional(),
  estimatedDaysUntilStockout: z.number().nullable().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const ProductInputSchema = ProductSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  supplierName: true,
  isLowStock: true,
  salesVelocityPerDay: true,
  estimatedDaysUntilStockout: true,
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

// ==============================================================================
// 4. STOCK MOVEMENTS (AUDITABLE LEDGER)
// ==============================================================================

export type MovementType =
  | "opening_stock"
  | "sale"
  | "stock_receipt"
  | "manual_adjustment"
  | "return"
  | "damage_writeoff";

export const StockMovementSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  productId: z.string(),
  productName: z.string().optional(),
  productSku: z.string().optional(),
  movementType: z.enum([
    "opening_stock",
    "sale",
    "stock_receipt",
    "manual_adjustment",
    "return",
    "damage_writeoff",
  ]),
  quantityChange: z.number(), // positive for additions, negative for deductions
  quantityAfter: z.number(),
  reason: z.string().min(1, "Adjustment reason is required"),
  referenceId: z.string().default(""),
  createdAt: z.string(),
});

export type StockMovement = z.infer<typeof StockMovementSchema>;

export const StockAdjustmentInputSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  movementType: z.enum(["stock_receipt", "manual_adjustment", "return", "damage_writeoff"]),
  quantityChange: z.number().refine((val) => val !== 0, "Quantity change cannot be zero"),
  reason: z.string().min(2, "Please specify a detailed audit reason"),
  referenceId: z.string().optional().default(""),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentInputSchema>;

// ==============================================================================
// 5. SALES TYPES
// ==============================================================================

export const SaleItemSchema = z.object({
  id: z.string().uuid().or(z.string()).optional(),
  saleId: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1),
  productSku: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  unitCost: z.number().min(0, "Unit cost cannot be negative"),
  totalPrice: z.number().min(0),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;

export const SaleSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  saleNumber: z.string(),
  saleDate: z.string(),
  totalAmount: z.number().min(0),
  totalCost: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.string().default("Cash"),
  paymentStatus: z.enum(["Paid", "Pending", "Partial", "Refunded"]).default("Paid"),
  customerNote: z.string().default(""),
  status: z.enum(["completed", "cancelled"]).default("completed"),
  idempotencyKey: z.string().optional(),
  items: z.array(SaleItemSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Sale = z.infer<typeof SaleSchema>;

export const CreateSaleInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().positive("Quantity must be positive"),
        unitPrice: z.number().min(0, "Unit price cannot be negative").optional(), // if omitted, uses current product price
      })
    )
    .min(1, "Sale must contain at least one product"),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.string().default("Bank Transfer"),
  paymentStatus: z.enum(["Paid", "Pending", "Partial", "Refunded"]).default("Paid"),
  customerNote: z.string().default(""),
  idempotencyKey: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleInputSchema>;

// ==============================================================================
// 6. RESTOCK ORDERS & SUPPLIER EMAILS
// ==============================================================================

export type RestockStatus =
  | "draft"
  | "email_sent"
  | "confirmed"
  | "partially_received"
  | "received"
  | "cancelled";

export const RestockOrderItemSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string().min(1),
  productName: z.string(),
  productSku: z.string(),
  quantityRequested: z.number().positive(),
  quantityReceived: z.number().min(0).default(0),
  unitCost: z.number().min(0),
  totalCost: z.number().min(0),
});

export type RestockOrderItem = z.infer<typeof RestockOrderItemSchema>;

export const RestockOrderSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  orderNumber: z.string(),
  supplierId: z.string().nullable().optional(),
  supplierName: z.string(),
  status: z.enum(["draft", "email_sent", "confirmed", "partially_received", "received", "cancelled"]),
  totalEstimatedCost: z.number().min(0),
  notes: z.string().default(""),
  expectedDeliveryDate: z.string().nullable().optional(),
  items: z.array(RestockOrderItemSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type RestockOrder = z.infer<typeof RestockOrderSchema>;

export type EmailDraftStatus = "draft" | "approved" | "sending" | "sent" | "failed";

export const SupplierEmailDraftSchema = z.object({
  id: z.string().uuid().or(z.string()),
  userId: z.string().optional(),
  supplierId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  restockOrderId: z.string().nullable().optional(),
  recipientEmail: z.string().email(),
  recipientName: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
  suggestedQuantity: z.number().min(0),
  reason: z.string(),
  status: z.enum(["draft", "approved", "sending", "sent", "failed"]),
  sentAt: z.string().nullable().optional(),
  errorMessage: z.string().optional(),
  providerMessageId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SupplierEmailDraft = z.infer<typeof SupplierEmailDraftSchema>;

// ==============================================================================
// 7. ACTION CENTRE & REORDER RECOMMENDATION TYPES
// ==============================================================================

export type ActionSeverity = "critical" | "warning" | "info";

export type ActionCategory =
  | "low_stock"
  | "lead_time_stockout"
  | "email_draft_approval"
  | "overdue_purchase_order"
  | "declining_sales"
  | "funding_deadline"
  | "integration_setup";

export interface BusinessAction {
  id: string;
  category: ActionCategory;
  severity: ActionSeverity;
  title: string;
  explanation: string;
  supportingData: {
    calculationText?: string;
    metrics?: Record<string, string | number | boolean | null>;
    breakdown?: string[];
  };
  recommendedNextStep: string;
  actionUrl: string;
  actionLabel: string;
  timestamp?: string;
  freshnessLabel?: string;
  metadata?: {
    productId?: string;
    supplierId?: string;
    orderId?: string;
    draftId?: string;
    opportunityId?: string;
    integrationKey?: string;
  };
}

export interface ActionSummary {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
}

export type ActivityStatus = "proposed" | "approved" | "executed" | "failed";

export type ActivityType =
  | "sale_recorded"
  | "stock_adjusted"
  | "stock_received"
  | "low_stock_detected"
  | "supplier_draft_created"
  | "email_approved"
  | "email_sent"
  | "email_failed"
  | "opportunity_saved"
  | "integration_error"
  | "purchase_order_created";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  relativeTime?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  unitOfMeasure: string;
  supplierId?: string | null;
  supplierName?: string;
  supplierLeadTimeDays?: number;
  safetyStock: number;
  averageDailySales: number | null;
  salesWindowDays: number;
  daysRemaining: number | null;
  leadTimeDemand: number | null;
  calculatedReorderPoint: number | null;
  configuredReorderThreshold: number;
  outstandingPOQuantity: number;
  outstandingPODetails?: string[];
  netShortfall: number;
  recommendedOrderQuantity: number;
  isImminentStockout: boolean;
  dataStatus: "complete" | "insufficient_history" | "missing_lead_time" | "unassigned_supplier";
  statusMessage: string;
  plainLanguageExplanation: string;
  setupAction?: {
    label: string;
    url: string;
  };
}

// ==============================================================================
// 8. OVERVIEW DASHBOARD METRICS
// ==============================================================================

export interface OverviewMetrics {
  totalProductsTracked: number;
  lowStockProductsCount: number;
  estimatedInventoryValuation: number;
  revenue: number;
  unitsSold: number;
  estimatedGrossProfit: number | null;
  costDataStatus?: "empty" | "complete" | "partial" | "unavailable";
  period: "7d" | "30d" | "90d" | "all";
  recentSales: Sale[];
  lowStockProducts: Product[];
  pendingEmailDrafts: SupplierEmailDraft[];
  recentAdjustments: StockMovement[];
  currency: CurrencyCode;
  // Unified Action Centre & Activity Timeline
  actions: BusinessAction[];
  actionSummary: ActionSummary;
  activityTimeline: ActivityEvent[];
  reorderRecommendations?: ReorderRecommendation[];
}
