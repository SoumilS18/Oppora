import {
  Product,
  ProductInput,
  Supplier,
  SupplierInput,
  Sale,
  CreateSaleInput,
  StockMovement,
  StockAdjustmentInput,
  RestockOrder,
  SupplierEmailDraft,
  OverviewMetrics,
  BusinessSettings,
} from "../../types/operations";
import {
  DEFAULT_BUSINESS_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EMAIL_DRAFTS,
  INITIAL_RESTOCK_ORDERS,
} from "./seedData";
import { sendSupplierEmail } from "../email/provider";
import { generateActionCenter } from "./actionCenter";
import { buildActivityTimeline } from "./activityTimeline";
import { BusinessAction, ActionSummary, ActivityEvent, ReorderRecommendation } from "../../types/operations";

export const DEMO_USER_ID = "demo-user-oppora-2026";

// Helper for exact monetary rounding
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Isolated Per-User Operations Memory Store
 * Enforces strict multi-tenant boundary even in in-memory storage mode.
 */
export class UserOperationsStore {
  public userId: string;
  private products: Product[] = [];
  private suppliers: Supplier[] = [];
  private sales: Sale[] = [];
  private movements: StockMovement[] = [];
  private drafts: SupplierEmailDraft[] = [];
  private restockOrders: RestockOrder[] = [];
  private savedOpportunities: any[] = [];
  private explicitEvents: ActivityEvent[] = [];
  private settings: BusinessSettings = { ...DEFAULT_BUSINESS_SETTINGS };
  private initialized = false;

  constructor(userId: string, isDemoUser: boolean = false) {
    this.userId = userId;
    if (isDemoUser) {
      this.initDemo();
    } else {
      this.initialized = true;
    }
  }

  private initDemo() {
    if (this.initialized) return;
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.sales = JSON.parse(JSON.stringify(INITIAL_SALES));
    this.movements = JSON.parse(JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    this.drafts = JSON.parse(JSON.stringify(INITIAL_EMAIL_DRAFTS));
    this.restockOrders = JSON.parse(JSON.stringify(INITIAL_RESTOCK_ORDERS));
    this.savedOpportunities = [
      {
        id: "saved-001",
        opportunity_id: "opp-nsf-sbir-2026",
        opportunity_snapshot: {
          id: "opp-nsf-sbir-2026",
          name: "NSF America's Seed Fund (SBIR/STTR Phase I)",
          provider: "National Science Foundation (NSF)",
          category: "Grant",
          fundingAmountOrBenefits: "$275,000 non-dilutive grant + technical assistance",
          applicationDeadline: "2026-11-05T23:59:59Z",
          deadlineLabel: "Nov 5, 2026",
          deadlineType: "specific",
          isExpired: false,
        },
        created_at: "2026-10-10T08:00:00Z",
      },
    ];
    this.settings = { ...DEFAULT_BUSINESS_SETTINGS };
    this.initialized = true;
  }

  // --------------------------------------------------------------------------
  // BUSINESS SETTINGS
  // --------------------------------------------------------------------------
  public getSettings(): BusinessSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<BusinessSettings>): BusinessSettings {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }

  // --------------------------------------------------------------------------
  // PRODUCTS & INVENTORY
  // --------------------------------------------------------------------------
  public getProducts(search?: string, category?: string, lowStockOnly?: boolean): Product[] {
    let result = this.products.filter((p) => p.isActive);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (category && category !== "All") {
      result = result.filter((p) => p.category === category);
    }

    if (lowStockOnly) {
      result = result.filter((p) => p.currentStock <= p.reorderThreshold);
    }

    return result.map((p) => {
      const sup = this.suppliers.find((s) => s.id === p.preferredSupplierId);
      const isLow = p.currentStock <= p.reorderThreshold;

      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      let unitsSold30d = 0;

      for (const sale of this.sales) {
        if (sale.status === "completed") {
          const saleTime = new Date(sale.saleDate).getTime();
          if (saleTime >= thirtyDaysAgo) {
            for (const item of sale.items) {
              if (item.productId === p.id) {
                unitsSold30d += item.quantity;
              }
            }
          }
        }
      }

      const velocity = round2(unitsSold30d / 30);
      let daysRemaining: number | null = null;
      if (velocity > 0.05) {
        daysRemaining = Math.max(0, Math.floor(p.currentStock / velocity));
      }

      return {
        ...p,
        supplierName: sup?.name || "Unassigned",
        isLowStock: isLow,
        salesVelocityPerDay: velocity,
        estimatedDaysUntilStockout: daysRemaining,
      };
    });
  }

  public getProductById(id: string): Product | null {
    const p = this.products.find((prod) => prod.id === id);
    if (!p) return null;
    const sup = this.suppliers.find((s) => s.id === p.preferredSupplierId);
    return {
      ...p,
      supplierName: sup?.name || "Unassigned",
      isLowStock: p.currentStock <= p.reorderThreshold,
    };
  }

  public createProduct(input: ProductInput): Product {
    const cleanSku = input.sku.trim().toUpperCase();
    const existing = this.products.find((p) => p.sku.toUpperCase() === cleanSku && p.isActive);
    if (existing) {
      throw new Error(`A product with SKU "${cleanSku}" already exists.`);
    }

    const initialStock = round2(input.currentStock || 0);
    if (initialStock < 0) {
      throw new Error("Current stock cannot be negative.");
    }

    const newProduct: Product = {
      ...input,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sku: cleanSku,
      currentStock: initialStock,
      reorderThreshold: round2(input.reorderThreshold || 10),
      preferredReorderQuantity: round2(input.preferredReorderQuantity || 50),
      unitCost: round2(input.unitCost || 0),
      sellingPrice: round2(input.sellingPrice || 0),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(newProduct);

    if (newProduct.currentStock > 0) {
      this.movements.unshift({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        productSku: newProduct.sku,
        movementType: "opening_stock",
        quantityChange: newProduct.currentStock,
        quantityAfter: newProduct.currentStock,
        reason: "Initial product stock creation",
        referenceId: "PRODUCT_INIT",
        createdAt: new Date().toISOString(),
      });
    }

    this.evaluateLowStockEvent(newProduct);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<ProductInput>): Product {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product not found: ${id}`);
    }

    const current = this.products[index];

    if (updates.sku && updates.sku.toUpperCase() !== current.sku.toUpperCase()) {
      const cleanSku = updates.sku.trim().toUpperCase();
      const conflict = this.products.find(
        (p) => p.id !== id && p.sku.toUpperCase() === cleanSku && p.isActive
      );
      if (conflict) {
        throw new Error(`SKU "${cleanSku}" is already used by another product.`);
      }
    }

    const updated: Product = {
      ...current,
      ...updates,
      sku: updates.sku ? updates.sku.trim().toUpperCase() : current.sku,
      unitCost: updates.unitCost !== undefined ? round2(updates.unitCost) : current.unitCost,
      sellingPrice: updates.sellingPrice !== undefined ? round2(updates.sellingPrice) : current.sellingPrice,
      reorderThreshold:
        updates.reorderThreshold !== undefined ? round2(updates.reorderThreshold) : current.reorderThreshold,
      preferredReorderQuantity:
        updates.preferredReorderQuantity !== undefined
          ? round2(updates.preferredReorderQuantity)
          : current.preferredReorderQuantity,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;
    this.evaluateLowStockEvent(updated);
    return updated;
  }

  public archiveProduct(id: string): boolean {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.products[index].isActive = false;
    this.products[index].updatedAt = new Date().toISOString();
    return true;
  }

  // --------------------------------------------------------------------------
  // STOCK ADJUSTMENT & AUDITABLE LEDGER
  // --------------------------------------------------------------------------
  public adjustStock(input: StockAdjustmentInput): { product: Product; movement: StockMovement } {
    const prod = this.products.find((p) => p.id === input.productId);
    if (!prod) {
      throw new Error(`Product with ID "${input.productId}" not found.`);
    }

    const qtyChange = round2(input.quantityChange);
    const newQty = round2(prod.currentStock + qtyChange);

    if (newQty < 0) {
      throw new Error(
        `Invalid adjustment: Resulting stock cannot be negative. Current: ${prod.currentStock}, Requested change: ${qtyChange}`
      );
    }

    prod.currentStock = newQty;
    prod.updatedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      movementType: input.movementType,
      quantityChange: qtyChange,
      quantityAfter: newQty,
      reason: input.reason.trim(),
      referenceId: input.referenceId || "MANUAL_ADJUSTMENT",
      createdAt: new Date().toISOString(),
    };

    this.movements.unshift(movement);
    this.evaluateLowStockEvent(prod);

    return { product: prod, movement };
  }

  public getStockMovements(productId?: string): StockMovement[] {
    if (productId) {
      return this.movements.filter((m) => m.productId === productId);
    }
    return [...this.movements];
  }

  // --------------------------------------------------------------------------
  // SALES MANAGEMENT
  // --------------------------------------------------------------------------
  public createSale(input: CreateSaleInput): Sale {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = this.sales.find((s) => s.idempotencyKey === input.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 2. Validate Items & Verify Available Quantities
    if (!input.items || input.items.length === 0) {
      throw new Error("Sale must include at least one product item.");
    }

    const itemsToProcess: Array<{
      product: Product;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      totalPrice: number;
    }> = [];

    let calculatedTotal = 0;
    let calculatedCost = 0;

    for (const itemInput of input.items) {
      const product = this.products.find((p) => p.id === itemInput.productId && p.isActive);
      if (!product) {
        throw new Error(`Product not found or inactive: "${itemInput.productId}"`);
      }

      const qty = round2(itemInput.quantity);
      if (qty <= 0) {
        throw new Error(`Quantity for "${product.name}" must be greater than zero.`);
      }

      if (product.currentStock < qty) {
        throw new Error(
          `Insufficient inventory for "${product.name}" (SKU: ${product.sku}). Available: ${product.currentStock} ${product.unitOfMeasure}, Requested: ${qty}`
        );
      }

      const unitPrice = itemInput.unitPrice !== undefined ? round2(itemInput.unitPrice) : product.sellingPrice;
      const unitCost = product.unitCost;
      const totalPrice = round2(qty * unitPrice);

      calculatedTotal += totalPrice;
      calculatedCost += round2(qty * unitCost);

      itemsToProcess.push({
        product,
        quantity: qty,
        unitPrice,
        unitCost,
        totalPrice,
      });
    }

    const discount = round2(input.discountAmount || 0);
    const finalTotal = Math.max(0, round2(calculatedTotal - discount));
    const saleId = `sale-${Date.now()}`;
    const saleNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Atomically deduct inventory and create stock movements
    const processedItems = itemsToProcess.map((item, idx) => {
      const prevStock = item.product.currentStock;
      const newStock = round2(prevStock - item.quantity);
      item.product.currentStock = newStock;
      item.product.updatedAt = new Date().toISOString();

      this.movements.unshift({
        id: `mov-${Date.now()}-${idx}`,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        movementType: "sale",
        quantityChange: -item.quantity,
        quantityAfter: newStock,
        reason: `Sale fulfilment: ${saleNumber}`,
        referenceId: saleId,
        createdAt: new Date().toISOString(),
      });

      this.evaluateLowStockEvent(item.product);

      return {
        id: `item-${Date.now()}-${idx}`,
        saleId,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        totalPrice: item.totalPrice,
      };
    });

    const newSale: Sale = {
      id: saleId,
      saleNumber,
      saleDate: new Date().toISOString(),
      totalAmount: finalTotal,
      totalCost: round2(calculatedCost),
      discountAmount: discount,
      paymentMethod: input.paymentMethod || "Bank Transfer",
      paymentStatus: input.paymentStatus || "Paid",
      customerNote: input.customerNote?.trim() || "",
      status: "completed",
      idempotencyKey: input.idempotencyKey,
      items: processedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sales.unshift(newSale);
    return newSale;
  }

  public cancelSale(saleId: string, reason: string): Sale {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) {
      throw new Error(`Sale "${saleId}" not found.`);
    }

    if (sale.status === "cancelled") {
      throw new Error(`Sale "${sale.saleNumber}" is already cancelled.`);
    }

    for (const item of sale.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        const prevStock = product.currentStock;
        const newStock = round2(prevStock + item.quantity);
        product.currentStock = newStock;
        product.updatedAt = new Date().toISOString();

        this.movements.unshift({
          id: `mov-${Date.now()}-cancel-${Math.floor(Math.random() * 1000)}`,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          movementType: "return",
          quantityChange: item.quantity,
          quantityAfter: newStock,
          reason: `Sale cancellation: ${sale.saleNumber} (${reason || "Customer return"})`,
          referenceId: sale.id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    sale.status = "cancelled";
    sale.customerNote = sale.customerNote
      ? `${sale.customerNote} | Cancelled: ${reason}`
      : `Cancelled: ${reason}`;
    sale.updatedAt = new Date().toISOString();

    return sale;
  }

  public getSales(period?: "7d" | "30d" | "90d" | "all"): Sale[] {
    if (!period || period === "all") {
      return [...this.sales];
    }

    const now = Date.now();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return this.sales.filter((s) => new Date(s.saleDate).getTime() >= cutoff);
  }

  // --------------------------------------------------------------------------
  // SUPPLIERS
  // --------------------------------------------------------------------------
  public getSuppliers(search?: string): Supplier[] {
    let result = this.suppliers.filter((s) => s.isActive);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.contactName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getSupplierById(id: string): Supplier | null {
    return this.suppliers.find((s) => s.id === id) || null;
  }

  public createSupplier(input: SupplierInput): Supplier {
    const cleanEmail = input.email.trim().toLowerCase();
    const newSupplier: Supplier = {
      ...input,
      id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      leadTimeDays: Math.max(0, input.leadTimeDays || 7),
      minOrderQuantity: Math.max(1, input.minOrderQuantity || 1),
      minOrderValue: round2(input.minOrderValue || 0),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.suppliers.unshift(newSupplier);
    return newSupplier;
  }

  public updateSupplier(id: string, updates: Partial<SupplierInput>): Supplier {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Supplier not found: ${id}`);
    }

    const current = this.suppliers[index];
    const updated: Supplier = {
      ...current,
      ...updates,
      email: updates.email ? updates.email.trim().toLowerCase() : current.email,
      minOrderValue: updates.minOrderValue !== undefined ? round2(updates.minOrderValue) : current.minOrderValue,
      updatedAt: new Date().toISOString(),
    };

    this.suppliers[index] = updated;
    return updated;
  }

  public archiveSupplier(id: string): boolean {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.suppliers[index].isActive = false;
    this.suppliers[index].updatedAt = new Date().toISOString();
    return true;
  }

  // --------------------------------------------------------------------------
  // LOW STOCK DETECTION & SUPPLIER EMAIL WORKFLOW
  // --------------------------------------------------------------------------
  public evaluateLowStockEvent(product: Product): void {
    if (!this.settings.autoLowStockAlerts) return;
    if (product.currentStock > product.reorderThreshold) return;

    // Deduplication check: Check if an active draft already exists for this product
    const existingDraft = this.drafts.find(
      (d) => d.productId === product.id && (d.status === "draft" || d.status === "approved" || d.status === "sending")
    );
    if (existingDraft) {
      return;
    }

    const supplier = this.suppliers.find((s) => s.id === product.preferredSupplierId && s.isActive);
    if (!supplier) return;

    if (this.settings.supplierEmailAutoDraft) {
      this.generateRestockDraftForProduct(product, supplier);
    }
  }

  public generateRestockDraftForProduct(product: Product, supplier: Supplier): SupplierEmailDraft {
    const suggestedQty = product.preferredReorderQuantity || 50;
    const company = this.settings.companyName || "Oppora Ventures";
    const sender = this.settings.emailSenderName || "Operations Team";

    const subject = `Restock inquiry: ${product.name} [SKU: ${product.sku}]`;
    const body = `Hello ${supplier.contactName || supplier.name},

Our current recorded stock of ${product.name} (SKU: ${product.sku}) is ${product.currentStock} ${product.unitOfMeasure}, which has reached our configured reorder threshold of ${product.reorderThreshold} ${product.unitOfMeasure}.

We would like to request availability, latest unit quotation, and the expected dispatch timeline for ${suggestedQty} ${product.unitOfMeasure}.

Please confirm the current price and estimated delivery date before we proceed with a purchase order.

Note: This inquiry is an operational restock inquiry, not a binding purchase commitment.

Regards,
${sender}
${company}`;

    const draft: SupplierEmailDraft = {
      id: `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      supplierId: supplier.id,
      productId: product.id,
      recipientEmail: supplier.email,
      recipientName: supplier.contactName || supplier.name,
      subject,
      body,
      suggestedQuantity: suggestedQty,
      reason: `Stock level (${product.currentStock} ${product.unitOfMeasure}) is at or below reorder threshold (${product.reorderThreshold} ${product.unitOfMeasure})`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.drafts.unshift(draft);
    return draft;
  }

  public getSupplierEmailDrafts(status?: "draft" | "approved" | "sent" | "failed"): SupplierEmailDraft[] {
    if (status) {
      return this.drafts.filter((d) => d.status === status);
    }
    return [...this.drafts];
  }

  public updateSupplierEmailDraft(id: string, updates: Partial<SupplierEmailDraft>): SupplierEmailDraft {
    const index = this.drafts.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Email draft not found: ${id}`);
    }

    this.drafts[index] = {
      ...this.drafts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.drafts[index];
  }

  public async approveAndSendSupplierEmail(draftId: string): Promise<{ draft: SupplierEmailDraft; success: boolean; message: string }> {
    const draft = this.drafts.find((d) => d.id === draftId);
    if (!draft) {
      throw new Error(`Email draft "${draftId}" not found.`);
    }

    if (draft.status === "sent") {
      throw new Error("This email has already been sent to the supplier.");
    }

    if (draft.status === "sending") {
      throw new Error("Email delivery is already in progress for this draft.");
    }

    // Verify authorized recipient matches an active supplier
    const supplier = this.suppliers.find((s) => s.id === draft.supplierId && s.isActive);
    if (supplier && supplier.email.toLowerCase() !== draft.recipientEmail.toLowerCase()) {
      throw new Error("Security alert: Draft recipient email does not match the configured supplier address.");
    }

    draft.status = "sending";
    draft.updatedAt = new Date().toISOString();

    const sendResult = await sendSupplierEmail({
      to: draft.recipientEmail,
      recipientName: draft.recipientName,
      subject: draft.subject,
      body: draft.body,
      replyTo: this.settings.replyToEmail || undefined,
      fromName: this.settings.emailSenderName || this.settings.companyName,
    }, this.userId);

    if (sendResult.success) {
      draft.status = "sent";
      draft.sentAt = new Date().toISOString();
      draft.providerMessageId = sendResult.messageId;
      draft.errorMessage = undefined;
      draft.updatedAt = new Date().toISOString();

      return {
        draft,
        success: true,
        message: `Accepted by email provider (${sendResult.provider}) for dispatch. Message ID: ${sendResult.messageId}`,
      };
    } else {
      // Unconfigured or failed provider
      draft.status = "approved"; // Stays approved for retry
      draft.errorMessage = sendResult.error;
      draft.updatedAt = new Date().toISOString();

      return {
        draft,
        success: false,
        message: sendResult.error || "Email delivery failed.",
      };
    }
  }

  // --------------------------------------------------------------------------
  // RESTOCK ORDERS & STOCK RECEIPT WORKFLOW
  // --------------------------------------------------------------------------
  public getRestockOrders(): RestockOrder[] {
    return [...this.restockOrders];
  }

  public createRestockOrder(input: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number }>;
    notes?: string;
  }): RestockOrder {
    const supplier = this.suppliers.find((s) => s.id === input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier "${input.supplierId}" not found.`);
    }

    let estimatedTotal = 0;
    const orderItems = input.items.map((item, idx) => {
      const prod = this.products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product "${item.productId}" not found.`);
      }
      const qty = round2(item.quantity);
      const cost = round2(qty * prod.unitCost);
      estimatedTotal += cost;

      return {
        id: `roi-${Date.now()}-${idx}`,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        quantityRequested: qty,
        quantityReceived: 0,
        unitCost: prod.unitCost,
        totalCost: cost,
      };
    });

    const order: RestockOrder = {
      id: `ro-${Date.now()}`,
      orderNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: "draft",
      totalEstimatedCost: round2(estimatedTotal),
      notes: input.notes || "",
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.restockOrders.unshift(order);
    return order;
  }

  public receiveRestockStock(
    orderId: string,
    receivedQuantities: Record<string, number>
  ): { order: RestockOrder; movements: StockMovement[] } {
    const order = this.restockOrders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Restock order "${orderId}" not found.`);
    }

    if (order.status === "received") {
      throw new Error(`Restock order "${order.orderNumber}" is already fully received.`);
    }

    const createdMovements: StockMovement[] = [];
    let allReceived = true;
    let anyReceived = false;

    for (const item of order.items) {
      const additionalQty = round2(receivedQuantities[item.productId] || 0);
      if (additionalQty > 0) {
        anyReceived = true;
        item.quantityReceived = round2(item.quantityReceived + additionalQty);

        const prod = this.products.find((p) => p.id === item.productId);
        if (prod) {
          const prev = prod.currentStock;
          const after = round2(prev + additionalQty);
          prod.currentStock = after;
          prod.updatedAt = new Date().toISOString();

          const movement: StockMovement = {
            id: `mov-${Date.now()}-rcv-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            movementType: "stock_receipt",
            quantityChange: additionalQty,
            quantityAfter: after,
            reason: `Restock receipt: ${order.orderNumber} from ${order.supplierName}`,
            referenceId: order.id,
            createdAt: new Date().toISOString(),
          };

          this.movements.unshift(movement);
          createdMovements.push(movement);
        }
      }

      if (item.quantityReceived < item.quantityRequested) {
        allReceived = false;
      }
    }

    if (allReceived) {
      order.status = "received";
    } else if (anyReceived) {
      order.status = "partially_received";
    }
    order.updatedAt = new Date().toISOString();

    return { order, movements: createdMovements };
  }

  // --------------------------------------------------------------------------
  // MANUAL "CHECK STOCK NOW"
  // --------------------------------------------------------------------------
  public checkStockNow(): { checkedProducts: number; lowStockCount: number; newDraftsCreated: number } {
    let lowStockCount = 0;
    let newDrafts = 0;

    for (const prod of this.products) {
      if (prod.isActive && prod.currentStock <= prod.reorderThreshold) {
        lowStockCount++;

        const existing = this.drafts.find(
          (d) => d.productId === prod.id && (d.status === "draft" || d.status === "approved" || d.status === "sending")
        );
        if (!existing) {
          const sup = this.suppliers.find((s) => s.id === prod.preferredSupplierId && s.isActive);
          if (sup) {
            this.generateRestockDraftForProduct(prod, sup);
            newDrafts++;
          }
        }
      }
    }

    return {
      checkedProducts: this.products.filter((p) => p.isActive).length,
      lowStockCount,
      newDraftsCreated: newDrafts,
    };
  }

  // --------------------------------------------------------------------------
  // OVERVIEW DASHBOARD METRICS
  // --------------------------------------------------------------------------
  public getOverviewMetrics(period: "7d" | "30d" | "90d" | "all" = "30d"): OverviewMetrics {
    const activeProducts = this.products.filter((p) => p.isActive);
    const lowStock = activeProducts.filter((p) => p.currentStock <= p.reorderThreshold);

    // Valuation calculation distinguishing known cost from missing cost
    let valuation = 0;
    let productsWithCost = 0;
    for (const p of activeProducts) {
      if (p.unitCost > 0) {
        valuation += p.currentStock * p.unitCost;
        productsWithCost++;
      }
    }

    const filteredSales = this.getSales(period).filter((s) => s.status === "completed");

    let revenue = 0;
    let totalCost = 0;
    let unitsSold = 0;
    let hasKnownCost = false;
    let hasMissingCost = false;

    for (const sale of filteredSales) {
      revenue += sale.totalAmount;
      for (const item of sale.items) {
        unitsSold += item.quantity;
        if (item.unitCost > 0) {
          totalCost += item.quantity * item.unitCost;
          hasKnownCost = true;
        } else {
          hasMissingCost = true;
        }
      }
    }

    let grossProfit: number | null = null;
    let costDataStatus: "empty" | "complete" | "partial" | "unavailable" = "empty";

    if (filteredSales.length === 0) {
      costDataStatus = "empty";
      grossProfit = 0;
    } else if (hasKnownCost && !hasMissingCost) {
      costDataStatus = "complete";
      grossProfit = round2(revenue - totalCost);
    } else if (hasKnownCost && hasMissingCost) {
      costDataStatus = "partial";
      grossProfit = round2(revenue - totalCost);
    } else {
      costDataStatus = "unavailable";
      grossProfit = null; // Do not fabricate 0-cost profit
    }

    // Generate Unified Action Centre & Recommendations
    const { actions, summary: actionSummary, recommendations: reorderRecommendations } = generateActionCenter({
      products: this.products,
      suppliers: this.suppliers,
      sales: this.sales,
      drafts: this.drafts,
      orders: this.restockOrders,
      savedOpportunities: this.savedOpportunities,
      settings: this.settings,
      systemConfig: {
        isSupabaseConfigured: false,
        isEmailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key_here"),
        storageMode: "memory",
      },
    });

    const currencySymbol = this.settings.defaultCurrency === "USD" ? "$" : this.settings.defaultCurrency === "EUR" ? "€" : "₹";
    const activityTimeline = buildActivityTimeline({
      sales: this.sales,
      movements: this.movements,
      drafts: this.drafts,
      orders: this.restockOrders,
      products: this.products,
      savedOpportunities: this.savedOpportunities,
      explicitEvents: this.explicitEvents,
      currencySymbol,
    });

    return {
      totalProductsTracked: activeProducts.length,
      lowStockProductsCount: lowStock.length,
      estimatedInventoryValuation: round2(valuation),
      revenue: round2(revenue),
      unitsSold: round2(unitsSold),
      estimatedGrossProfit: grossProfit,
      costDataStatus,
      period,
      recentSales: this.sales.slice(0, 5),
      lowStockProducts: lowStock.slice(0, 6).map((p) => {
        const sup = this.suppliers.find((s) => s.id === p.preferredSupplierId);
        return {
          ...p,
          supplierName: sup?.name || "Unassigned",
          isLowStock: true,
        };
      }),
      pendingEmailDrafts: this.drafts.filter((d) => d.status === "draft" || d.status === "approved").slice(0, 5),
      recentAdjustments: this.movements.slice(0, 6),
      currency: this.settings.defaultCurrency || "INR",
      actions,
      actionSummary,
      activityTimeline,
      reorderRecommendations,
    };
  }

  public getActionCenter(): { actions: BusinessAction[]; summary: ActionSummary; recommendations: ReorderRecommendation[] } {
    return generateActionCenter({
      products: this.products,
      suppliers: this.suppliers,
      sales: this.sales,
      drafts: this.drafts,
      orders: this.restockOrders,
      savedOpportunities: this.savedOpportunities,
      settings: this.settings,
      systemConfig: {
        isSupabaseConfigured: false,
        isEmailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key_here"),
        storageMode: "memory",
      },
    });
  }

  public getActivityTimeline(): ActivityEvent[] {
    const currencySymbol = this.settings.defaultCurrency === "USD" ? "$" : this.settings.defaultCurrency === "EUR" ? "€" : "₹";
    return buildActivityTimeline({
      sales: this.sales,
      movements: this.movements,
      drafts: this.drafts,
      orders: this.restockOrders,
      products: this.products,
      savedOpportunities: this.savedOpportunities,
      explicitEvents: this.explicitEvents,
      currencySymbol,
    });
  }

  public recordActivityEvent(event: ActivityEvent) {
    this.explicitEvents.unshift(event);
  }

  public getSavedOpportunities(): any[] {
    return [...this.savedOpportunities];
  }

  public saveOpportunity(opportunity: any, userNotes: string = ""): any {
    const oppId = opportunity.id || `opp-${Date.now()}`;
    const existingIdx = this.savedOpportunities.findIndex((o) => o.opportunity_id === oppId);
    const record = {
      id: `saved-${Date.now()}`,
      user_id: this.userId,
      opportunity_id: oppId,
      opportunity_snapshot: opportunity,
      user_notes: userNotes,
      created_at: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      this.savedOpportunities[existingIdx] = record;
    } else {
      this.savedOpportunities.unshift(record);
    }
    return record;
  }

  public removeSavedOpportunity(opportunityId: string): boolean {
    const len = this.savedOpportunities.length;
    this.savedOpportunities = this.savedOpportunities.filter((o) => o.opportunity_id !== opportunityId);
    return this.savedOpportunities.length < len;
  }
}

/**
 * Multi-Tenant Memory Store Manager
 */
class OperationsMemoryStoreManager {
  private userStores = new Map<string, UserOperationsStore>();

  constructor() {
    // Seed default demo user
    this.userStores.set(DEMO_USER_ID, new UserOperationsStore(DEMO_USER_ID, true));
  }

  public forUser(userId: string = DEMO_USER_ID): UserOperationsStore {
    if (!this.userStores.has(userId)) {
      const isDemo = userId === DEMO_USER_ID;
      this.userStores.set(userId, new UserOperationsStore(userId, isDemo));
    }
    return this.userStores.get(userId)!;
  }

  // Backwards compatibility delegations for demo workspace
  public getSettings(): BusinessSettings {
    return this.forUser(DEMO_USER_ID).getSettings();
  }
  public updateSettings(updates: Partial<BusinessSettings>): BusinessSettings {
    return this.forUser(DEMO_USER_ID).updateSettings(updates);
  }
  public getProducts(search?: string, category?: string, lowStockOnly?: boolean): Product[] {
    return this.forUser(DEMO_USER_ID).getProducts(search, category, lowStockOnly);
  }
  public getProductById(id: string): Product | null {
    return this.forUser(DEMO_USER_ID).getProductById(id);
  }
  public createProduct(input: ProductInput): Product {
    return this.forUser(DEMO_USER_ID).createProduct(input);
  }
  public updateProduct(id: string, updates: Partial<ProductInput>): Product {
    return this.forUser(DEMO_USER_ID).updateProduct(id, updates);
  }
  public archiveProduct(id: string): boolean {
    return this.forUser(DEMO_USER_ID).archiveProduct(id);
  }
  public adjustStock(input: StockAdjustmentInput): { product: Product; movement: StockMovement } {
    return this.forUser(DEMO_USER_ID).adjustStock(input);
  }
  public getStockMovements(productId?: string): StockMovement[] {
    return this.forUser(DEMO_USER_ID).getStockMovements(productId);
  }
  public createSale(input: CreateSaleInput): Sale {
    return this.forUser(DEMO_USER_ID).createSale(input);
  }
  public cancelSale(saleId: string, reason: string): Sale {
    return this.forUser(DEMO_USER_ID).cancelSale(saleId, reason);
  }
  public getSales(period?: "7d" | "30d" | "90d" | "all"): Sale[] {
    return this.forUser(DEMO_USER_ID).getSales(period);
  }
  public getSuppliers(search?: string): Supplier[] {
    return this.forUser(DEMO_USER_ID).getSuppliers(search);
  }
  public getSupplierById(id: string): Supplier | null {
    return this.forUser(DEMO_USER_ID).getSupplierById(id);
  }
  public createSupplier(input: SupplierInput): Supplier {
    return this.forUser(DEMO_USER_ID).createSupplier(input);
  }
  public updateSupplier(id: string, updates: Partial<SupplierInput>): Supplier {
    return this.forUser(DEMO_USER_ID).updateSupplier(id, updates);
  }
  public archiveSupplier(id: string): boolean {
    return this.forUser(DEMO_USER_ID).archiveSupplier(id);
  }
  public getSupplierEmailDrafts(status?: "draft" | "approved" | "sent" | "failed"): SupplierEmailDraft[] {
    return this.forUser(DEMO_USER_ID).getSupplierEmailDrafts(status);
  }
  public updateSupplierEmailDraft(id: string, updates: Partial<SupplierEmailDraft>): SupplierEmailDraft {
    return this.forUser(DEMO_USER_ID).updateSupplierEmailDraft(id, updates);
  }
  public approveAndSendSupplierEmail(draftId: string): Promise<{ draft: SupplierEmailDraft; success: boolean; message: string }> {
    return this.forUser(DEMO_USER_ID).approveAndSendSupplierEmail(draftId);
  }
  public getRestockOrders(): RestockOrder[] {
    return this.forUser(DEMO_USER_ID).getRestockOrders();
  }
  public createRestockOrder(input: any): RestockOrder {
    return this.forUser(DEMO_USER_ID).createRestockOrder(input);
  }
  public receiveRestockStock(orderId: string, receivedQuantities: Record<string, number>) {
    return this.forUser(DEMO_USER_ID).receiveRestockStock(orderId, receivedQuantities);
  }
  public checkStockNow() {
    return this.forUser(DEMO_USER_ID).checkStockNow();
  }
  public getOverviewMetrics(period?: "7d" | "30d" | "90d" | "all"): OverviewMetrics {
    return this.forUser(DEMO_USER_ID).getOverviewMetrics(period);
  }
}

// Global singleton for Next.js lifecycle
const globalStore = global as unknown as { __opporaOperationsStoreManager?: OperationsMemoryStoreManager };
if (!globalStore.__opporaOperationsStoreManager) {
  globalStore.__opporaOperationsStoreManager = new OperationsMemoryStoreManager();
}

export const operationsStore = globalStore.__opporaOperationsStoreManager;
