import { getSupabaseConfig } from "../supabase/config";
import { createClient } from "../supabase/server";
import { operationsStore, DEMO_USER_ID, round2 } from "./store";
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
  BusinessAction,
  ActionSummary,
  ActivityEvent,
  ReorderRecommendation,
} from "../../types/operations";
import { sendSupplierEmail } from "../email/provider";
import { generateActionCenter } from "./actionCenter";
import { buildActivityTimeline } from "./activityTimeline";

export class ConfigurationError extends Error {
  public code = "PERSISTENCE_NOT_CONFIGURED";
  public status = 503;
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class DatabaseError extends Error {
  public code = "DATABASE_UNAVAILABLE";
  public status = 503;
  public details?: any;
  constructor(message: string, details?: any) {
    super(message);
    this.name = "DatabaseError";
    this.details = details;
  }
}

export interface StorageResolution {
  mode: "supabase" | "memory";
  isDemo: boolean;
  warning?: string;
}

/**
 * Resolves active storage mode according to strict production safety rules.
 * Rule: Production must NEVER silently fall back to in-memory storage.
 */
export function resolveStorageMode(): StorageResolution {
  const isProd = process.env.NODE_ENV === "production";
  const explicitBackend = process.env.OPPORA_STORAGE_BACKEND?.toLowerCase();
  const { isConfigured } = getSupabaseConfig();

  if (isProd) {
    if (explicitBackend === "memory") {
      // Allowed only if explicitly mandated via environment configuration
      return {
        mode: "memory",
        isDemo: true,
        warning: "Production is running with explicitly configured in-memory storage (OPPORA_STORAGE_BACKEND=memory).",
      };
    }

    if (!isConfigured) {
      throw new ConfigurationError(
        "Production persistence configuration error: Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY). In production, Oppora requires an active Supabase database and will not silently fall back to in-memory storage."
      );
    }

    return { mode: "supabase", isDemo: false };
  }

  // Non-production (development, test, demo)
  if (explicitBackend === "memory") {
    return { mode: "memory", isDemo: true };
  }

  if (explicitBackend === "supabase") {
    if (!isConfigured) {
      throw new ConfigurationError(
        "OPPORA_STORAGE_BACKEND is set to 'supabase', but Supabase credentials are missing or invalid."
      );
    }
    return { mode: "supabase", isDemo: false };
  }

  if (isConfigured) {
    return { mode: "supabase", isDemo: false };
  }

  // Safe fallback to isolated in-memory store in dev/demo mode
  return {
    mode: "memory",
    isDemo: true,
    warning: "Running with in-memory development store because Supabase is not configured.",
  };
}

/**
 * Unified Operations Persistence Service
 * Delegates strictly to Supabase or isolated in-memory store with transactional integrity.
 */
export class OperationsService {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  public async getProducts(
    userId: string,
    search?: string,
    category?: string,
    lowStockOnly?: boolean
  ): Promise<{ products: Product[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const store = operationsStore.forUser(userId);
      const products = store.getProducts(search, category, lowStockOnly);
      return { products, storageMode: "memory", isDemo };
    }

    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, suppliers:preferred_supplier_id(name)")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseError(`Failed to fetch products from Supabase: ${error.message}`, error);
    }

    let products: Product[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      description: row.description || "",
      category: row.category,
      currentStock: Number(row.current_stock),
      unitOfMeasure: row.unit_of_measure,
      reorderThreshold: Number(row.reorder_threshold),
      preferredReorderQuantity: Number(row.preferred_reorder_quantity),
      unitCost: Number(row.unit_cost),
      sellingPrice: Number(row.selling_price),
      preferredSupplierId: row.preferred_supplier_id,
      supplierName: row.suppliers?.name || "Unassigned",
      storageLocation: row.storage_location || "",
      isLowStock: Number(row.current_stock) <= Number(row.reorder_threshold),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    if (lowStockOnly) {
      products = products.filter((p) => p.isLowStock);
    }

    return { products, storageMode: "supabase", isDemo };
  }

  public async createProduct(userId: string, input: ProductInput): Promise<Product> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).createProduct(input);
    }

    const supabase = createClient();
    const cleanSku = input.sku.trim().toUpperCase();

    const insertData: any = {
      user_id: userId,
      name: input.name,
      sku: cleanSku,
      description: input.description || "",
      category: input.category || "General",
      current_stock: round2(input.currentStock || 0),
      unit_of_measure: input.unitOfMeasure || "units",
      reorder_threshold: round2(input.reorderThreshold || 10),
      preferred_reorder_quantity: round2(input.preferredReorderQuantity || 50),
      unit_cost: round2(input.unitCost || 0),
      selling_price: round2(input.sellingPrice || 0),
      preferred_supplier_id: input.preferredSupplierId || null,
      storage_location: input.storageLocation || "",
      is_active: true,
    };

    const { data, error } = await supabase.from("products").insert(insertData).select().single();
    if (error) {
      throw new DatabaseError(`Failed to create product in database: ${error.message}`, error);
    }

    // Insert opening stock movement if stock > 0
    if (data.current_stock > 0) {
      await supabase.from("stock_movements").insert({
        user_id: userId,
        product_id: data.id,
        movement_type: "opening_stock",
        quantity_change: data.current_stock,
        quantity_after: data.current_stock,
        reason: "Initial product stock creation",
        reference_id: "PRODUCT_INIT",
      });
    }

    return {
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description || "",
      category: data.category,
      currentStock: Number(data.current_stock),
      unitOfMeasure: data.unit_of_measure,
      reorderThreshold: Number(data.reorder_threshold),
      preferredReorderQuantity: Number(data.preferred_reorder_quantity),
      unitCost: Number(data.unit_cost),
      sellingPrice: Number(data.selling_price),
      preferredSupplierId: data.preferred_supplier_id,
      storageLocation: data.storage_location,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async updateProduct(userId: string, id: string, updates: Partial<ProductInput>): Promise<Product> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).updateProduct(id, updates);
    }

    const supabase = createClient();
    const updatePayload: any = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.sku !== undefined) updatePayload.sku = updates.sku.trim().toUpperCase();
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.unitOfMeasure !== undefined) updatePayload.unit_of_measure = updates.unitOfMeasure;
    if (updates.reorderThreshold !== undefined) updatePayload.reorder_threshold = round2(updates.reorderThreshold);
    if (updates.preferredReorderQuantity !== undefined)
      updatePayload.preferred_reorder_quantity = round2(updates.preferredReorderQuantity);
    if (updates.unitCost !== undefined) updatePayload.unit_cost = round2(updates.unitCost);
    if (updates.sellingPrice !== undefined) updatePayload.selling_price = round2(updates.sellingPrice);
    if (updates.preferredSupplierId !== undefined) updatePayload.preferred_supplier_id = updates.preferredSupplierId || null;
    if (updates.storageLocation !== undefined) updatePayload.storage_location = updates.storageLocation;

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update product: ${error.message}`, error);
    }

    return {
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description || "",
      category: data.category,
      currentStock: Number(data.current_stock),
      unitOfMeasure: data.unit_of_measure,
      reorderThreshold: Number(data.reorder_threshold),
      preferredReorderQuantity: Number(data.preferred_reorder_quantity),
      unitCost: Number(data.unit_cost),
      sellingPrice: Number(data.selling_price),
      preferredSupplierId: data.preferred_supplier_id,
      storageLocation: data.storage_location,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async archiveProduct(userId: string, id: string): Promise<boolean> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).archiveProduct(id);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new DatabaseError(`Failed to archive product: ${error.message}`, error);
    }
    return true;
  }

  public async adjustStock(
    userId: string,
    input: StockAdjustmentInput
  ): Promise<{ product: any; movement: any }> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).adjustStock(input);
    }

    const supabase = createClient();
    const { data: prod, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", input.productId)
      .eq("user_id", userId)
      .single();

    if (prodErr || !prod) {
      throw new DatabaseError("Product not found or access denied", prodErr);
    }

    const qtyChange = round2(input.quantityChange);
    const newQty = round2(Number(prod.current_stock) + qtyChange);
    if (newQty < 0) {
      throw new Error(`Invalid adjustment: Resulting stock cannot be negative. Current: ${prod.current_stock}`);
    }

    const { error: updErr } = await supabase
      .from("products")
      .update({ current_stock: newQty })
      .eq("id", input.productId)
      .eq("user_id", userId);

    if (updErr) {
      throw new DatabaseError(`Failed to update stock: ${updErr.message}`, updErr);
    }

    const { data: mov, error: movErr } = await supabase
      .from("stock_movements")
      .insert({
        user_id: userId,
        product_id: input.productId,
        movement_type: input.movementType,
        quantity_change: qtyChange,
        quantity_after: newQty,
        reason: input.reason.trim(),
        reference_id: input.referenceId || "MANUAL_ADJUSTMENT",
      })
      .select()
      .single();

    if (movErr) {
      throw new DatabaseError(`Failed to log movement: ${movErr.message}`, movErr);
    }

    return { product: { ...prod, currentStock: newQty }, movement: mov };
  }

  // --------------------------------------------------------------------------
  // SALES
  // --------------------------------------------------------------------------
  public async getSales(
    userId: string,
    period?: "7d" | "30d" | "90d" | "all"
  ): Promise<{ sales: Sale[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const sales = operationsStore.forUser(userId).getSales(period);
      return { sales, storageMode: "memory", isDemo };
    }

    const supabase = createClient();
    let query = supabase
      .from("sales")
      .select("*, items:sale_items(*)")
      .eq("user_id", userId)
      .order("sale_date", { ascending: false });

    if (period && period !== "all") {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("sale_date", cutoff);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseError(`Failed to fetch sales: ${error.message}`, error);
    }

    const sales: Sale[] = (data || []).map((s: any) => ({
      id: s.id,
      saleNumber: s.sale_number,
      saleDate: s.sale_date,
      totalAmount: Number(s.total_amount),
      totalCost: Number(s.total_cost),
      discountAmount: Number(s.discount_amount),
      paymentMethod: s.payment_method,
      paymentStatus: s.payment_status,
      customerNote: s.customer_note || "",
      status: s.status,
      idempotencyKey: s.idempotency_key,
      items: (s.items || []).map((item: any) => ({
        id: item.id,
        saleId: item.sale_id,
        productId: item.product_id,
        productName: item.product_name,
        productSku: item.product_sku,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        unitCost: Number(item.unit_cost),
        totalPrice: Number(item.total_price),
      })),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return { sales, storageMode: "supabase", isDemo };
  }

  public async createSale(userId: string, input: CreateSaleInput): Promise<Sale> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).createSale(input);
    }

    const supabase = createClient();
    const saleNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase.rpc("record_sale", {
      p_sale_number: saleNumber,
      p_idempotency_key: input.idempotencyKey || null,
      p_payment_method: input.paymentMethod || "Bank Transfer",
      p_payment_status: input.paymentStatus || "Paid",
      p_discount_amount: round2(input.discountAmount || 0),
      p_customer_note: input.customerNote || "",
      p_items: input.items,
    });

    if (error) {
      throw new DatabaseError(`Failed to record sale: ${error.message}`, error);
    }

    // Fetch the created sale with items
    const { data: createdSale, error: fetchErr } = await supabase
      .from("sales")
      .select("*, items:sale_items(*)")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();

    if (fetchErr) {
      throw new DatabaseError(`Sale recorded but retrieval failed: ${fetchErr.message}`, fetchErr);
    }

    return {
      id: createdSale.id,
      saleNumber: createdSale.sale_number,
      saleDate: createdSale.sale_date,
      totalAmount: Number(createdSale.total_amount),
      totalCost: Number(createdSale.total_cost),
      discountAmount: Number(createdSale.discount_amount),
      paymentMethod: createdSale.payment_method,
      paymentStatus: createdSale.payment_status,
      customerNote: createdSale.customer_note || "",
      status: createdSale.status,
      idempotencyKey: createdSale.idempotency_key,
      items: (createdSale.items || []).map((i: any) => ({
        id: i.id,
        saleId: i.sale_id,
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        unitCost: Number(i.unit_cost),
        totalPrice: Number(i.total_price),
      })),
      createdAt: createdSale.created_at,
      updatedAt: createdSale.updated_at,
    };
  }

  public async cancelSale(userId: string, saleId: string, reason: string): Promise<Sale> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).cancelSale(saleId, reason);
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("cancel_sale", {
      p_sale_id: saleId,
      p_reason: reason || "Customer return",
    });

    if (error) {
      throw new DatabaseError(`Failed to cancel sale: ${error.message}`, error);
    }

    return data;
  }

  // --------------------------------------------------------------------------
  // SUPPLIERS
  // --------------------------------------------------------------------------
  public async getSuppliers(
    userId: string,
    search?: string
  ): Promise<{ suppliers: Supplier[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const suppliers = operationsStore.forUser(userId).getSuppliers(search);
      return { suppliers, storageMode: "memory", isDemo };
    }

    const supabase = createClient();
    let query = supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,contact_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseError(`Failed to fetch suppliers: ${error.message}`, error);
    }

    const suppliers: Supplier[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      contactName: row.contact_name || "",
      email: row.email,
      phone: row.phone || "",
      website: row.website || "",
      leadTimeDays: Number(row.lead_time_days),
      minOrderQuantity: Number(row.min_order_quantity),
      minOrderValue: Number(row.min_order_value),
      notes: row.notes || "",
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { suppliers, storageMode: "supabase", isDemo };
  }

  public async createSupplier(userId: string, input: SupplierInput): Promise<Supplier> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).createSupplier(input);
    }

    const supabase = createClient();
    const cleanEmail = input.email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        user_id: userId,
        name: input.name,
        contact_name: input.contactName || "",
        email: cleanEmail,
        phone: input.phone || "",
        website: input.website || "",
        lead_time_days: input.leadTimeDays || 7,
        min_order_quantity: input.minOrderQuantity || 1,
        min_order_value: round2(input.minOrderValue || 0),
        notes: input.notes || "",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create supplier: ${error.message}`, error);
    }

    return {
      id: data.id,
      name: data.name,
      contactName: data.contact_name || "",
      email: data.email,
      phone: data.phone || "",
      website: data.website || "",
      leadTimeDays: Number(data.lead_time_days),
      minOrderQuantity: Number(data.min_order_quantity),
      minOrderValue: Number(data.min_order_value),
      notes: data.notes || "",
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async updateSupplier(
    userId: string,
    id: string,
    updates: Partial<SupplierInput>
  ): Promise<Supplier> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).updateSupplier(id, updates);
    }

    const supabase = createClient();
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contactName !== undefined) payload.contact_name = updates.contactName;
    if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.website !== undefined) payload.website = updates.website;
    if (updates.leadTimeDays !== undefined) payload.lead_time_days = updates.leadTimeDays;
    if (updates.minOrderQuantity !== undefined) payload.min_order_quantity = updates.minOrderQuantity;
    if (updates.minOrderValue !== undefined) payload.min_order_value = round2(updates.minOrderValue);
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("suppliers")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update supplier: ${error.message}`, error);
    }

    return {
      id: data.id,
      name: data.name,
      contactName: data.contact_name || "",
      email: data.email,
      phone: data.phone || "",
      website: data.website || "",
      leadTimeDays: Number(data.lead_time_days),
      minOrderQuantity: Number(data.min_order_quantity),
      minOrderValue: Number(data.min_order_value),
      notes: data.notes || "",
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async archiveSupplier(userId: string, id: string): Promise<boolean> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).archiveSupplier(id);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("suppliers")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new DatabaseError(`Failed to archive supplier: ${error.message}`, error);
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // EMAIL DRAFTS & APPROVAL
  // --------------------------------------------------------------------------
  public async getSupplierEmailDrafts(
    userId: string,
    status?: "draft" | "approved" | "sent" | "failed"
  ): Promise<{ drafts: SupplierEmailDraft[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const drafts = operationsStore.forUser(userId).getSupplierEmailDrafts(status);
      return { drafts, storageMode: "memory", isDemo };
    }

    const supabase = createClient();
    let query = supabase
      .from("supplier_email_drafts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseError(`Failed to fetch drafts: ${error.message}`, error);
    }

    const drafts: SupplierEmailDraft[] = (data || []).map((row: any) => ({
      id: row.id,
      supplierId: row.supplier_id,
      productId: row.product_id,
      restockOrderId: row.restock_order_id,
      recipientEmail: row.recipient_email,
      recipientName: row.recipient_name,
      subject: row.subject,
      body: row.body,
      suggestedQuantity: Number(row.suggested_quantity),
      reason: row.reason,
      status: row.status,
      sentAt: row.sent_at,
      errorMessage: row.error_message,
      providerMessageId: row.provider_message_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { drafts, storageMode: "supabase", isDemo };
  }

  public async updateSupplierEmailDraft(
    userId: string,
    id: string,
    updates: Partial<SupplierEmailDraft>
  ): Promise<SupplierEmailDraft> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).updateSupplierEmailDraft(id, updates);
    }

    const supabase = createClient();
    const payload: any = {};
    if (updates.subject !== undefined) payload.subject = updates.subject;
    if (updates.body !== undefined) payload.body = updates.body;
    if (updates.suggestedQuantity !== undefined) payload.suggested_quantity = round2(updates.suggestedQuantity);
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await supabase
      .from("supplier_email_drafts")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update email draft: ${error.message}`, error);
    }

    return {
      id: data.id,
      supplierId: data.supplier_id,
      productId: data.product_id,
      restockOrderId: data.restock_order_id,
      recipientEmail: data.recipient_email,
      recipientName: data.recipient_name,
      subject: data.subject,
      body: data.body,
      suggestedQuantity: Number(data.suggested_quantity),
      reason: data.reason,
      status: data.status,
      sentAt: data.sent_at,
      errorMessage: data.error_message,
      providerMessageId: data.provider_message_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  public async approveAndSendSupplierEmail(
    userId: string,
    draftId: string
  ): Promise<{ draft: SupplierEmailDraft; success: boolean; message: string }> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).approveAndSendSupplierEmail(draftId);
    }

    const supabase = createClient();

    // Lock and verify ownership
    const { data: draft, error: draftErr } = await supabase
      .from("supplier_email_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", userId)
      .single();

    if (draftErr || !draft) {
      throw new DatabaseError("Draft not found or unauthorized", draftErr);
    }

    if (draft.status === "sent") {
      throw new Error("This email has already been sent to the supplier.");
    }

    if (draft.status === "sending") {
      throw new Error("Email delivery is already in progress for this draft.");
    }

    // Verify authorized supplier recipient
    if (draft.supplier_id) {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("email")
        .eq("id", draft.supplier_id)
        .eq("user_id", userId)
        .single();

      if (supplier && supplier.email.toLowerCase() !== draft.recipient_email.toLowerCase()) {
        throw new Error("Security alert: Draft recipient email does not match the configured supplier address.");
      }
    }

    // Fetch user settings for sender details
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, email_sender_name, reply_to_email")
      .eq("id", userId)
      .single();

    // Mark status as 'sending' to lock
    await supabase
      .from("supplier_email_drafts")
      .update({ status: "sending" })
      .eq("id", draftId)
      .eq("user_id", userId);

    const sendResult = await sendSupplierEmail({
      to: draft.recipient_email,
      recipientName: draft.recipient_name,
      subject: draft.subject,
      body: draft.body,
      replyTo: profile?.reply_to_email || undefined,
      fromName: profile?.email_sender_name || profile?.company_name || "Oppora Operations",
    }, userId);

    if (sendResult.success) {
      const { data: updated } = await supabase
        .from("supplier_email_drafts")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: sendResult.messageId,
          error_message: null,
        })
        .eq("id", draftId)
        .eq("user_id", userId)
        .select()
        .single();

      return {
        draft: {
          id: updated.id,
          supplierId: updated.supplier_id,
          productId: updated.product_id,
          restockOrderId: updated.restock_order_id,
          recipientEmail: updated.recipient_email,
          recipientName: updated.recipient_name,
          subject: updated.subject,
          body: updated.body,
          suggestedQuantity: Number(updated.suggested_quantity),
          reason: updated.reason,
          status: updated.status,
          sentAt: updated.sent_at,
          providerMessageId: updated.provider_message_id,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
        },
        success: true,
        message: `Accepted by email provider (${sendResult.provider}) for dispatch. Message ID: ${sendResult.messageId}`,
      };
    } else {
      await supabase
        .from("supplier_email_drafts")
        .update({
          status: "approved",
          error_message: sendResult.error,
        })
        .eq("id", draftId)
        .eq("user_id", userId);

      return {
        draft: {
          ...draft,
          status: "approved",
          errorMessage: sendResult.error,
        },
        success: false,
        message: sendResult.error || "Email delivery failed.",
      };
    }
  }

  public async checkStockNow(
    userId: string
  ): Promise<{ checkedProducts: number; lowStockCount: number; newDraftsCreated: number }> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).checkStockNow();
    }

    // For Supabase, query low-stock products and generate missing drafts
    const supabase = createClient();
    const { data: products } = await supabase
      .from("products")
      .select("*, supplier:preferred_supplier_id(*)")
      .eq("user_id", userId)
      .eq("is_active", true);

    let lowStockCount = 0;
    let newDrafts = 0;

    for (const prod of products || []) {
      if (Number(prod.current_stock) <= Number(prod.reorder_threshold)) {
        lowStockCount++;

        // Deduplication check
        const { data: existing } = await supabase
          .from("supplier_email_drafts")
          .select("id")
          .eq("product_id", prod.id)
          .eq("user_id", userId)
          .in("status", ["draft", "approved", "sending"])
          .limit(1);

        if (!existing || existing.length === 0) {
          if (prod.supplier && prod.supplier.is_active) {
            const suggestedQty = prod.preferred_reorder_quantity || 50;
            await supabase.from("supplier_email_drafts").insert({
              user_id: userId,
              supplier_id: prod.supplier.id,
              product_id: prod.id,
              recipient_email: prod.supplier.email,
              recipient_name: prod.supplier.contact_name || prod.supplier.name,
              subject: `Restock inquiry: ${prod.name} [SKU: ${prod.sku}]`,
              body: `Hello ${prod.supplier.contact_name || prod.supplier.name},\n\nOur current recorded stock of ${prod.name} (SKU: ${prod.sku}) is ${prod.current_stock} ${prod.unit_of_measure}, which has reached our configured reorder threshold of ${prod.reorder_threshold} ${prod.unit_of_measure}.\n\nWe would like to request availability and quote for ${suggestedQty} ${prod.unit_of_measure}.\n\nNote: This inquiry is an operational restock inquiry, not a binding purchase commitment.`,
              suggested_quantity: suggestedQty,
              reason: `Stock level (${prod.current_stock}) at or below reorder threshold (${prod.reorder_threshold})`,
              status: "draft",
            });
            newDrafts++;
          }
        }
      }
    }

    return {
      checkedProducts: (products || []).length,
      lowStockCount,
      newDraftsCreated: newDrafts,
    };
  }

  // --------------------------------------------------------------------------
  // OVERVIEW METRICS
  // --------------------------------------------------------------------------
  public async getOverviewMetrics(
    userId: string,
    period: "7d" | "30d" | "90d" | "all" = "30d"
  ): Promise<{ metrics: OverviewMetrics; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const metrics = operationsStore.forUser(userId).getOverviewMetrics(period);
      return { metrics, storageMode: "memory", isDemo };
    }

    const { products } = await this.getProducts(userId);
    const { sales } = await this.getSales(userId, period);
    const { drafts } = await this.getSupplierEmailDrafts(userId);
    const { suppliers } = await this.getSuppliers(userId);
    const orders = await this.getRestockOrders(userId);
    const { settings } = await this.getSettings(userId);

    const supabase = createClient();
    const { data: movementsData } = await supabase
      .from("stock_movements")
      .select("*, products:product_id(name, sku)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const movements: StockMovement[] = (movementsData || []).map((m: any) => ({
      id: m.id,
      productId: m.product_id,
      productName: m.products?.name || "Product",
      productSku: m.products?.sku || "",
      movementType: m.movement_type,
      quantityChange: Number(m.quantity_change),
      quantityAfter: Number(m.quantity_after),
      reason: m.reason,
      referenceId: m.reference_id || "",
      createdAt: m.created_at,
    }));

    const { data: savedOppsData } = await supabase
      .from("saved_opportunities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { actions, summary: actionSummary, recommendations: reorderRecommendations } = generateActionCenter({
      products,
      suppliers,
      sales,
      drafts,
      orders,
      savedOpportunities: savedOppsData || [],
      settings,
      systemConfig: {
        isSupabaseConfigured: true,
        isEmailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key_here"),
        storageMode: "supabase",
      },
    });

    const currencySymbol = settings.defaultCurrency === "USD" ? "$" : settings.defaultCurrency === "EUR" ? "€" : "₹";
    const activityTimeline = buildActivityTimeline({
      sales,
      movements,
      drafts,
      orders,
      products,
      savedOpportunities: savedOppsData || [],
      currencySymbol,
    });

    const activeProds = products.filter((p) => p.isActive);
    const lowStock = activeProds.filter((p) => p.isLowStock);

    let valuation = 0;
    for (const p of activeProds) {
      if (p.unitCost > 0) {
        valuation += p.currentStock * p.unitCost;
      }
    }

    let revenue = 0;
    let totalCost = 0;
    let unitsSold = 0;
    let hasKnownCost = false;
    let hasMissingCost = false;

    const completedSales = sales.filter((s) => s.status === "completed");
    for (const sale of completedSales) {
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

    if (completedSales.length === 0) {
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
      grossProfit = null;
    }

    const metrics: OverviewMetrics = {
      totalProductsTracked: activeProds.length,
      lowStockProductsCount: lowStock.length,
      estimatedInventoryValuation: round2(valuation),
      revenue: round2(revenue),
      unitsSold: round2(unitsSold),
      estimatedGrossProfit: grossProfit,
      costDataStatus,
      period,
      recentSales: sales.slice(0, 5),
      lowStockProducts: lowStock.slice(0, 6),
      pendingEmailDrafts: drafts.filter((d) => d.status === "draft" || d.status === "approved").slice(0, 5),
      recentAdjustments: movements.slice(0, 6),
      currency: settings.defaultCurrency || "INR",
      actions,
      actionSummary,
      activityTimeline,
      reorderRecommendations,
    };

    return { metrics, storageMode: "supabase", isDemo };
  }

  public async getActionCenter(
    userId: string
  ): Promise<{ actions: BusinessAction[]; summary: ActionSummary; recommendations: ReorderRecommendation[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { metrics, storageMode, isDemo } = await this.getOverviewMetrics(userId, "30d");
    return {
      actions: metrics.actions,
      summary: metrics.actionSummary,
      recommendations: metrics.reorderRecommendations || [],
      storageMode,
      isDemo,
    };
  }

  public async getActivityTimeline(
    userId: string
  ): Promise<{ timeline: ActivityEvent[]; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { metrics, storageMode, isDemo } = await this.getOverviewMetrics(userId, "30d");
    return {
      timeline: metrics.activityTimeline,
      storageMode,
      isDemo,
    };
  }

  // --------------------------------------------------------------------------
  // SETTINGS
  // --------------------------------------------------------------------------
  public async getSettings(
    userId: string
  ): Promise<{ settings: BusinessSettings; storageMode: "supabase" | "memory"; isDemo: boolean }> {
    const { mode, isDemo } = resolveStorageMode();

    if (mode === "memory") {
      const settings = operationsStore.forUser(userId).getSettings();
      return { settings, storageMode: "memory", isDemo };
    }

    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch settings: ${error.message}`, error);
    }

    const settings: BusinessSettings = {
      companyName: profile.company_name || "",
      defaultCurrency: profile.default_currency || "INR",
      timezone: profile.timezone || "Asia/Kolkata",
      businessCategory: profile.business_category || "Manufacturing & Retail",
      country: profile.country || "India",
      state: profile.state || "",
      autoLowStockAlerts: profile.auto_low_stock_alerts ?? true,
      supplierEmailAutoDraft: profile.supplier_email_auto_draft ?? true,
      emailSenderName: profile.email_sender_name || "",
      replyToEmail: profile.reply_to_email || "",
    };

    return { settings, storageMode: "supabase", isDemo };
  }

  public async updateSettings(
    userId: string,
    updates: Partial<BusinessSettings>
  ): Promise<BusinessSettings> {
    const { mode } = resolveStorageMode();

    if (mode === "memory") {
      return operationsStore.forUser(userId).updateSettings(updates);
    }

    const supabase = createClient();
    const payload: any = {};
    if (updates.companyName !== undefined) payload.company_name = updates.companyName;
    if (updates.defaultCurrency !== undefined) payload.default_currency = updates.defaultCurrency;
    if (updates.timezone !== undefined) payload.timezone = updates.timezone;
    if (updates.businessCategory !== undefined) payload.business_category = updates.businessCategory;
    if (updates.country !== undefined) payload.country = updates.country;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.autoLowStockAlerts !== undefined) payload.auto_low_stock_alerts = updates.autoLowStockAlerts;
    if (updates.supplierEmailAutoDraft !== undefined) payload.supplier_email_auto_draft = updates.supplierEmailAutoDraft;
    if (updates.emailSenderName !== undefined) payload.email_sender_name = updates.emailSenderName;
    if (updates.replyToEmail !== undefined) payload.reply_to_email = updates.replyToEmail;

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update business settings: ${error.message}`, error);
    }

    return {
      companyName: data.company_name || "",
      defaultCurrency: data.default_currency || "INR",
      timezone: data.timezone || "Asia/Kolkata",
      businessCategory: data.business_category || "Manufacturing & Retail",
      country: data.country || "India",
      state: data.state || "",
      autoLowStockAlerts: data.auto_low_stock_alerts ?? true,
      supplierEmailAutoDraft: data.supplier_email_auto_draft ?? true,
      emailSenderName: data.email_sender_name || "",
      replyToEmail: data.reply_to_email || "",
    };
  }

  // --------------------------------------------------------------------------
  // RESTOCK ORDERS
  // --------------------------------------------------------------------------
  public async getRestockOrders(userId: string): Promise<RestockOrder[]> {
    const { mode } = resolveStorageMode();
    if (mode === "memory") {
      return operationsStore.forUser(userId).getRestockOrders();
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("restock_orders")
      .select("*, items:restock_order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch restock orders: ${error.message}`, error);
    }

    return (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      supplierId: o.supplier_id,
      supplierName: o.supplier_name,
      status: o.status,
      totalEstimatedCost: Number(o.total_estimated_cost),
      notes: o.notes || "",
      expectedDeliveryDate: o.expected_delivery_date,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku,
        quantityRequested: Number(i.quantity_requested),
        quantityReceived: Number(i.quantity_received),
        unitCost: Number(i.unit_cost),
        totalCost: Number(i.total_cost),
      })),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));
  }

  public async createRestockOrder(userId: string, input: any): Promise<RestockOrder> {
    const { mode } = resolveStorageMode();
    if (mode === "memory") {
      return operationsStore.forUser(userId).createRestockOrder(input);
    }
    const supabase = createClient();
    // Implementation via Supabase tables
    const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: supplier } = await supabase.from("suppliers").select("name").eq("id", input.supplierId).single();

    const { data: order, error } = await supabase
      .from("restock_orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        supplier_id: input.supplierId,
        supplier_name: supplier?.name || "Supplier",
        status: "draft",
        notes: input.notes || "",
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create restock order: ${error.message}`, error);
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      supplierId: order.supplier_id,
      supplierName: order.supplier_name,
      status: order.status,
      totalEstimatedCost: Number(order.total_estimated_cost),
      notes: order.notes,
      items: [],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  public async receiveRestockStock(
    userId: string,
    orderId: string,
    receivedQuantities: Record<string, number>
  ): Promise<{ order: any; movements: any[] }> {
    const { mode } = resolveStorageMode();
    if (mode === "memory") {
      return operationsStore.forUser(userId).receiveRestockStock(orderId, receivedQuantities);
    }
    const supabase = createClient();
    const { data, error } = await supabase.rpc("receive_restock_stock", {
      p_order_id: orderId,
      p_received_quantities: receivedQuantities,
    });

    if (error) {
      throw new DatabaseError(`Failed to receive restock stock: ${error.message}`, error);
    }
    return { order: data, movements: [] };
  }
}

export const operationsService = new OperationsService();
