-- ==============================================================================
-- OPPORA 2.0: STARTUP OPERATIONS COPILOT MIGRATION
-- Database Schema, Composite Multi-Tenant Foreign Keys, RLS, & Atomic RPCs
-- ==============================================================================

-- 0. UTILITY FUNCTION: AUTO-UPDATE UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN 
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- 1. BUSINESS PROFILE SETTINGS EXTENSION
-- Extends the profiles table safely without destroying existing profile records
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS business_category TEXT DEFAULT 'Manufacturing & Retail',
  ADD COLUMN IF NOT EXISTS auto_low_stock_alerts BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS supplier_email_auto_draft BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_sender_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reply_to_email TEXT DEFAULT '';

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT DEFAULT '',
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    website TEXT DEFAULT '',
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    min_order_quantity INTEGER NOT NULL DEFAULT 1,
    min_order_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_supplier_user UNIQUE (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(user_id, is_active);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'General',
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit_of_measure TEXT NOT NULL DEFAULT 'units',
    reorder_threshold NUMERIC(12,2) NOT NULL DEFAULT 10.00,
    preferred_reorder_quantity NUMERIC(12,2) NOT NULL DEFAULT 50.00,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    preferred_supplier_id UUID,
    storage_location TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_product_user UNIQUE (id, user_id),
    CONSTRAINT unique_user_product_sku UNIQUE (user_id, sku),
    CONSTRAINT non_negative_current_stock CHECK (current_stock >= 0),
    CONSTRAINT positive_quantities CHECK (reorder_threshold >= 0 AND preferred_reorder_quantity >= 0 AND unit_cost >= 0 AND selling_price >= 0),
    CONSTRAINT fk_product_preferred_supplier FOREIGN KEY (preferred_supplier_id, user_id) 
        REFERENCES public.suppliers(id, user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(preferred_supplier_id);

-- 4. STOCK MOVEMENTS (AUDITABLE INVENTORY LEDGER)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('opening_stock', 'sale', 'stock_receipt', 'manual_adjustment', 'return', 'damage_writeoff')),
    quantity_change NUMERIC(12,2) NOT NULL,
    quantity_after NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_stock_movement_product FOREIGN KEY (product_id, user_id)
        REFERENCES public.products(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_user_prod ON public.stock_movements(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(user_id, created_at DESC);

-- 5. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_number TEXT NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
    payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending', 'Partial', 'Refunded')),
    customer_note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_sale_user UNIQUE (id, user_id),
    CONSTRAINT unique_user_sale_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_sales_user_date ON public.sales(user_id, sale_date DESC);

-- 6. SALE ITEMS TABLE (HISTORICAL LINE ITEM SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id, user_id)
        REFERENCES public.sales(id, user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id, user_id)
        REFERENCES public.products(id, user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_prod ON public.sale_items(product_id);

-- 7. RESTOCK ORDERS (LIGHTWEIGHT PURCHASE ORDERS)
CREATE TABLE IF NOT EXISTS public.restock_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    supplier_id UUID,
    supplier_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'email_sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
    total_estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT '',
    expected_delivery_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_restock_order_user UNIQUE (id, user_id),
    CONSTRAINT fk_restock_orders_supplier FOREIGN KEY (supplier_id, user_id)
        REFERENCES public.suppliers(id, user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_restock_orders_user ON public.restock_orders(user_id, created_at DESC);

-- 8. RESTOCK ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.restock_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    quantity_requested NUMERIC(12,2) NOT NULL CHECK (quantity_requested > 0),
    quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (quantity_received >= 0),
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_restock_order_items_order FOREIGN KEY (order_id, user_id)
        REFERENCES public.restock_orders(id, user_id) ON DELETE CASCADE,
    CONSTRAINT fk_restock_order_items_product FOREIGN KEY (product_id, user_id)
        REFERENCES public.products(id, user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_restock_order_items_order ON public.restock_order_items(order_id);

-- 9. SUPPLIER EMAIL DRAFTS & COMMUNICATION LOGS
CREATE TABLE IF NOT EXISTS public.supplier_email_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplier_id UUID,
    product_id UUID,
    restock_order_id UUID,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    suggested_quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sending', 'sent', 'failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT DEFAULT '',
    provider_message_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_email_drafts_supplier FOREIGN KEY (supplier_id, user_id)
        REFERENCES public.suppliers(id, user_id) ON DELETE SET NULL,
    CONSTRAINT fk_email_drafts_product FOREIGN KEY (product_id, user_id)
        REFERENCES public.products(id, user_id) ON DELETE SET NULL,
    CONSTRAINT fk_email_drafts_order FOREIGN KEY (restock_order_id, user_id)
        REFERENCES public.restock_orders(id, user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_emails_user ON public.supplier_email_drafts(user_id, status);

-- 10. LOW STOCK DEDUPLICATION EVENTS
CREATE TABLE IF NOT EXISTS public.low_stock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    stock_level NUMERIC(12,2) NOT NULL,
    reorder_threshold NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'email_drafted', 'resolved', 'ignored')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT fk_low_stock_events_product FOREIGN KEY (product_id, user_id)
        REFERENCES public.products(id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_low_stock_events_prod ON public.low_stock_events(user_id, product_id, status);

-- 11. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_sales_updated_at ON public.sales;
CREATE TRIGGER trigger_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_restock_orders_updated_at ON public.restock_orders;
CREATE TRIGGER trigger_restock_orders_updated_at BEFORE UPDATE ON public.restock_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_supplier_emails_updated_at ON public.supplier_email_drafts;
CREATE TRIGGER trigger_supplier_emails_updated_at BEFORE UPDATE ON public.supplier_email_drafts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL OPERATIONAL TABLES
-- Strict User Isolation: Explicit SELECT, INSERT, UPDATE, DELETE policies
-- ==============================================================================

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_events ENABLE ROW LEVEL SECURITY;

-- SUPPLIERS
DROP POLICY IF EXISTS "suppliers_select_own" ON public.suppliers;
CREATE POLICY "suppliers_select_own" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "suppliers_insert_own" ON public.suppliers;
CREATE POLICY "suppliers_insert_own" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "suppliers_update_own" ON public.suppliers;
CREATE POLICY "suppliers_update_own" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "suppliers_delete_own" ON public.suppliers;
CREATE POLICY "suppliers_delete_own" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_own" ON public.products;
CREATE POLICY "products_select_own" ON public.products FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- STOCK MOVEMENTS
DROP POLICY IF EXISTS "movements_select_own" ON public.stock_movements;
CREATE POLICY "movements_select_own" ON public.stock_movements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "movements_insert_own" ON public.stock_movements;
CREATE POLICY "movements_insert_own" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SALES
DROP POLICY IF EXISTS "sales_select_own" ON public.sales;
CREATE POLICY "sales_select_own" ON public.sales FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sales_insert_own" ON public.sales;
CREATE POLICY "sales_insert_own" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sales_update_own" ON public.sales;
CREATE POLICY "sales_update_own" ON public.sales FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SALE ITEMS
DROP POLICY IF EXISTS "sale_items_select_own" ON public.sale_items;
CREATE POLICY "sale_items_select_own" ON public.sale_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sale_items_insert_own" ON public.sale_items;
CREATE POLICY "sale_items_insert_own" ON public.sale_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RESTOCK ORDERS
DROP POLICY IF EXISTS "restock_orders_select_own" ON public.restock_orders;
CREATE POLICY "restock_orders_select_own" ON public.restock_orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "restock_orders_insert_own" ON public.restock_orders;
CREATE POLICY "restock_orders_insert_own" ON public.restock_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "restock_orders_update_own" ON public.restock_orders;
CREATE POLICY "restock_orders_update_own" ON public.restock_orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RESTOCK ORDER ITEMS
DROP POLICY IF EXISTS "restock_order_items_select_own" ON public.restock_order_items;
CREATE POLICY "restock_order_items_select_own" ON public.restock_order_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "restock_order_items_insert_own" ON public.restock_order_items;
CREATE POLICY "restock_order_items_insert_own" ON public.restock_order_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SUPPLIER EMAIL DRAFTS
DROP POLICY IF EXISTS "supplier_emails_select_own" ON public.supplier_email_drafts;
CREATE POLICY "supplier_emails_select_own" ON public.supplier_email_drafts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "supplier_emails_insert_own" ON public.supplier_email_drafts;
CREATE POLICY "supplier_emails_insert_own" ON public.supplier_email_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "supplier_emails_update_own" ON public.supplier_email_drafts;
CREATE POLICY "supplier_emails_update_own" ON public.supplier_email_drafts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LOW STOCK EVENTS
DROP POLICY IF EXISTS "low_stock_select_own" ON public.low_stock_events;
CREATE POLICY "low_stock_select_own" ON public.low_stock_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "low_stock_insert_own" ON public.low_stock_events;
CREATE POLICY "low_stock_insert_own" ON public.low_stock_events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "low_stock_update_own" ON public.low_stock_events;
CREATE POLICY "low_stock_update_own" ON public.low_stock_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 13. ATOMIC TRANSACTION RPC FUNCTIONS
-- Ensure Financial & Inventory Consistency Under Concurrent Requests
-- ==============================================================================

-- A. RECORD SALE ATOMICALLY
CREATE OR REPLACE FUNCTION public.record_sale(
    p_sale_number TEXT,
    p_idempotency_key TEXT,
    p_payment_method TEXT,
    p_payment_status TEXT,
    p_discount_amount NUMERIC,
    p_customer_note TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_existing_sale RECORD;
    v_sale_id UUID;
    v_item JSONB;
    v_prod_id UUID;
    v_qty NUMERIC;
    v_unit_price NUMERIC;
    v_unit_cost NUMERIC;
    v_product RECORD;
    v_total_amount NUMERIC := 0.00;
    v_total_cost NUMERIC := 0.00;
    v_calculated_subtotal NUMERIC := 0.00;
    v_discount NUMERIC := COALESCE(p_discount_amount, 0.00);
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to record sale.';
    END IF;

    -- 1. Idempotency Check
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        SELECT * INTO v_existing_sale FROM public.sales 
        WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
        
        IF FOUND THEN
            RETURN to_jsonb(v_existing_sale);
        END IF;
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Sale must include at least one item.';
    END IF;

    v_sale_id := gen_random_uuid();

    -- 2. Validate Items, Lock Product Rows FOR UPDATE, Check Inventory Balances
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'productId')::UUID;
        v_qty := ROUND((v_item->>'quantity')::NUMERIC, 2);

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantity must be greater than zero.';
        END IF;

        -- Lock product row exclusively to prevent race conditions
        SELECT * INTO v_product FROM public.products
        WHERE id = v_prod_id AND user_id = v_user_id AND is_active = TRUE
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found or inactive.', v_prod_id;
        END IF;

        IF v_product.current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient inventory for % (SKU: %). Available: %, Requested: %',
                v_product.name, v_product.sku, v_product.current_stock, v_qty;
        END IF;

        v_unit_price := ROUND(COALESCE((v_item->>'unitPrice')::NUMERIC, v_product.selling_price), 2);
        v_unit_cost := v_product.unit_cost;

        v_calculated_subtotal := v_calculated_subtotal + ROUND(v_qty * v_unit_price, 2);
        v_total_cost := v_total_cost + ROUND(v_qty * v_unit_cost, 2);

        -- Deduct inventory atomically
        UPDATE public.products
        SET current_stock = current_stock - v_qty,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_prod_id AND user_id = v_user_id;

        -- Insert audit stock movement
        INSERT INTO public.stock_movements (
            user_id, product_id, movement_type, quantity_change, quantity_after, reason, reference_id
        ) VALUES (
            v_user_id, v_prod_id, 'sale', -v_qty, (v_product.current_stock - v_qty),
            'Sale fulfilment: ' || p_sale_number, v_sale_id::TEXT
        );

        -- Insert sale item snapshot
        INSERT INTO public.sale_items (
            user_id, sale_id, product_id, product_name, product_sku, quantity, unit_price, unit_cost, total_price
        ) VALUES (
            v_user_id, v_sale_id, v_prod_id, v_product.name, v_product.sku, v_qty, v_unit_price, v_unit_cost, ROUND(v_qty * v_unit_price, 2)
        );
    END LOOP;

    v_total_amount := GREATEST(0.00, v_calculated_subtotal - v_discount);

    -- 3. Insert Sale Master Record
    INSERT INTO public.sales (
        id, user_id, sale_number, sale_date, total_amount, total_cost, discount_amount,
        payment_method, payment_status, customer_note, status, idempotency_key
    ) VALUES (
        v_sale_id, v_user_id, p_sale_number, timezone('utc'::text, now()), v_total_amount, v_total_cost, v_discount,
        COALESCE(p_payment_method, 'Bank Transfer'), COALESCE(p_payment_status, 'Paid'),
        COALESCE(p_customer_note, ''), 'completed', p_idempotency_key
    );

    SELECT * INTO v_existing_sale FROM public.sales WHERE id = v_sale_id;
    RETURN to_jsonb(v_existing_sale);
END;
$$;

-- B. CANCEL SALE ATOMICALLY
CREATE OR REPLACE FUNCTION public.cancel_sale(
    p_sale_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_sale RECORD;
    v_item RECORD;
    v_prod RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Lock sale row
    SELECT * INTO v_sale FROM public.sales
    WHERE id = p_sale_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale % not found.', p_sale_id;
    END IF;

    IF v_sale.status = 'cancelled' THEN
        RAISE EXCEPTION 'Sale % is already cancelled.', v_sale.sale_number;
    END IF;

    -- Revert inventory for each item with 'return' movement
    FOR v_item IN SELECT * FROM public.sale_items WHERE sale_id = p_sale_id AND user_id = v_user_id
    LOOP
        SELECT * INTO v_prod FROM public.products WHERE id = v_item.product_id AND user_id = v_user_id FOR UPDATE;
        IF FOUND THEN
            UPDATE public.products
            SET current_stock = current_stock + v_item.quantity,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_item.product_id AND user_id = v_user_id;

            INSERT INTO public.stock_movements (
                user_id, product_id, movement_type, quantity_change, quantity_after, reason, reference_id
            ) VALUES (
                v_user_id, v_item.product_id, 'return', v_item.quantity, (v_prod.current_stock + v_item.quantity),
                'Sale cancellation reversal: ' || v_sale.sale_number || ' (' || COALESCE(p_reason, 'Customer return') || ')',
                p_sale_id::TEXT
            );
        END IF;
    END LOOP;

    UPDATE public.sales
    SET status = 'cancelled',
        customer_note = CASE 
            WHEN customer_note = '' THEN 'Cancelled: ' || COALESCE(p_reason, 'Reason not specified')
            ELSE customer_note || ' | Cancelled: ' || COALESCE(p_reason, 'Reason not specified')
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_sale_id AND user_id = v_user_id;

    SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
    RETURN to_jsonb(v_sale);
END;
$$;

-- C. RECEIVE RESTOCK ORDER ATOMICALLY
CREATE OR REPLACE FUNCTION public.receive_restock_stock(
    p_order_id UUID,
    p_received_quantities JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_order RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_add_qty NUMERIC;
    v_all_received BOOLEAN := TRUE;
    v_any_received BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_order FROM public.restock_orders
    WHERE id = p_order_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Restock order % not found.', p_order_id;
    END IF;

    IF v_order.status = 'received' THEN
        RAISE EXCEPTION 'Restock order % has already been fully received.', v_order.order_number;
    END IF;

    FOR v_item IN SELECT * FROM public.restock_order_items WHERE order_id = p_order_id AND user_id = v_user_id
    LOOP
        v_add_qty := ROUND(COALESCE((p_received_quantities->>v_item.product_id::TEXT)::NUMERIC, 0.00), 2);
        
        IF v_add_qty > 0 THEN
            v_any_received := TRUE;

            UPDATE public.restock_order_items
            SET quantity_received = quantity_received + v_add_qty
            WHERE id = v_item.id AND user_id = v_user_id;

            SELECT * INTO v_prod FROM public.products WHERE id = v_item.product_id AND user_id = v_user_id FOR UPDATE;
            IF FOUND THEN
                UPDATE public.products
                SET current_stock = current_stock + v_add_qty,
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_item.product_id AND user_id = v_user_id;

                INSERT INTO public.stock_movements (
                    user_id, product_id, movement_type, quantity_change, quantity_after, reason, reference_id
                ) VALUES (
                    v_user_id, v_item.product_id, 'stock_receipt', v_add_qty, (v_prod.current_stock + v_add_qty),
                    'Restock receipt: ' || v_order.order_number || ' from ' || v_order.supplier_name,
                    p_order_id::TEXT
                );
            END IF;
        END IF;

        IF (v_item.quantity_received + v_add_qty) < v_item.quantity_requested THEN
            v_all_received := FALSE;
        END IF;
    END LOOP;

    IF v_all_received THEN
        UPDATE public.restock_orders SET status = 'received', updated_at = timezone('utc'::text, now()) WHERE id = p_order_id;
    ELSIF v_any_received THEN
        UPDATE public.restock_orders SET status = 'partially_received', updated_at = timezone('utc'::text, now()) WHERE id = p_order_id;
    END IF;

    SELECT * INTO v_order FROM public.restock_orders WHERE id = p_order_id;
    RETURN to_jsonb(v_order);
END;
$$;
