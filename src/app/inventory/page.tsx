"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Product, Supplier, StockMovement, MovementType } from "@/types/operations";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  History,
  TrendingDown,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
} from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedProductMovements, setSelectedProductMovements] = useState<{
    product: Product;
    movements: StockMovement[];
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "General",
    currentStock: 0,
    unitOfMeasure: "pcs",
    reorderThreshold: 10,
    preferredReorderQuantity: 50,
    unitCost: 0,
    sellingPrice: 0,
    preferredSupplierId: "",
    storageLocation: "",
  });

  const [adjustData, setAdjustData] = useState<{
    movementType: MovementType;
    quantityChange: number;
    reason: string;
  }>({
    movementType: "manual_adjustment",
    quantityChange: 0,
    reason: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setDbError(null);
      const url = new URL("/api/operations/products", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (categoryFilter !== "All") url.searchParams.set("category", categoryFilter);
      if (lowStockOnly) url.searchParams.set("lowStock", "true");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        setDbError(data.error || `Database error (${res.status})`);
      } else {
        setProducts(data.products || []);
      }
    } catch (err: any) {
      setDbError(err.message || "Failed to connect to database service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/operations/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [categoryFilter, lowStockOnly]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lowStockParam = params.get("lowStock");
      const searchParam = params.get("search");
      const prodParam = params.get("productId") || params.get("product");

      if (lowStockParam === "true") {
        setLowStockOnly(true);
      }
      if (searchParam) {
        setSearch(searchParam);
      } else if (prodParam) {
        setSearch(prodParam);
      }
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Open Add Product Modal
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      description: "",
      category: "Packaging",
      currentStock: 0,
      unitOfMeasure: "pcs",
      reorderThreshold: 15,
      preferredReorderQuantity: 100,
      unitCost: 10,
      sellingPrice: 25,
      preferredSupplierId: suppliers[0]?.id || "",
      storageLocation: "Shelf A-1",
    });
    setFormError(null);
    setShowAddModal(true);
  };

  // Open Edit Product Modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description,
      category: p.category,
      currentStock: p.currentStock,
      unitOfMeasure: p.unitOfMeasure,
      reorderThreshold: p.reorderThreshold,
      preferredReorderQuantity: p.preferredReorderQuantity,
      unitCost: p.unitCost,
      sellingPrice: p.sellingPrice,
      preferredSupplierId: p.preferredSupplierId || "",
      storageLocation: p.storageLocation,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!formData.sku.trim()) {
      setFormError("Product SKU is required.");
      return;
    }

    try {
      if (editingProduct) {
        const res = await fetch("/api/operations/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, ...formData }),
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Product "${formData.name}" updated successfully.`);
          setShowAddModal(false);
          fetchProducts();
        } else {
          setFormError(data.error || "Failed to update product.");
        }
      } else {
        const res = await fetch("/api/operations/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Product "${formData.name}" created successfully.`);
          setShowAddModal(false);
          fetchProducts();
        } else {
          setFormError(data.error || "Failed to create product.");
        }
      }
    } catch {
      setFormError("Network error saving product.");
    }
  };

  // Archive Product
  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"? Historical sales and ledger records will be preserved.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/operations/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setActionSuccess(`Product "${name}" archived.`);
        fetchProducts();
      }
    } catch {}
  };

  // Open Stock Adjustment Modal
  const openAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustData({
      movementType: "manual_adjustment",
      quantityChange: 0,
      reason: "",
    });
    setFormError(null);
  };

  // Execute Stock Adjustment
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setFormError(null);

    if (adjustData.quantityChange === 0) {
      setFormError("Quantity change cannot be zero.");
      return;
    }
    if (!adjustData.reason.trim()) {
      setFormError("Detailed audit reason is required for inventory movements.");
      return;
    }

    try {
      const res = await fetch("/api/operations/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          movementType: adjustData.movementType,
          quantityChange: Number(adjustData.quantityChange),
          reason: adjustData.reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(
          `Stock for "${adjustingProduct.name}" adjusted by ${adjustData.quantityChange > 0 ? `+${adjustData.quantityChange}` : adjustData.quantityChange}. New stock: ${data.product.currentStock}.`
        );
        setAdjustingProduct(null);
        fetchProducts();
      } else {
        setFormError(data.error || "Adjustment rejected.");
      }
    } catch {
      setFormError("Network failure executing stock adjustment.");
    }
  };

  // View Stock Movement History
  const handleViewMovements = async (p: Product) => {
    try {
      const res = await fetch(`/api/operations/inventory/movements?productId=${p.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProductMovements({ product: p, movements: data.movements || [] });
      }
    } catch {}
  };

  const categories = Array.from(new Set(["All", ...products.map((p) => p.category)]));

  return (
    <AppShell
      title="Inventory Management"
      subtitle="Accurate stock levels, auditable ledger movements, and low-stock replenishment"
      action={
        <button onClick={openAddModal} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}>
          <Plus size={14} />
          Add Product
        </button>
      }
    >
      {/* Database Error Alert */}
      {dbError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            color: "#991B1B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertTriangle size={18} color="#DC2626" />
            <div>
              <strong>Database Unavailable: </strong>
              <span>{dbError}</span>
            </div>
          </div>
          <button
            onClick={() => { fetchProducts(); fetchSuppliers(); }}
            style={{
              padding: "0.25rem 0.65rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#FFFFFF",
              backgroundColor: "#DC2626",
              borderRadius: "var(--radius-xs)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {actionSuccess && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.65rem 1rem",
            backgroundColor: "var(--brand-forest-light)",
            border: "1px solid var(--brand-forest-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            color: "var(--brand-forest)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} style={{ fontSize: "0.75rem", color: "var(--brand-forest)", fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: "1 1 280px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, or description..."
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-medium)",
                fontSize: "0.88rem",
              }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Category Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "0.4rem 0.65rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-medium)",
                fontSize: "0.82rem",
                backgroundColor: "#FFFFFF",
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.82rem",
              fontWeight: 600,
              backgroundColor: lowStockOnly ? "var(--accent-terracotta-light)" : "var(--surface-subtle)",
              color: lowStockOnly ? "var(--accent-terracotta)" : "var(--text-charcoal)",
              border: `1px solid ${lowStockOnly ? "var(--accent-terracotta-border)" : "var(--border-medium)"}`,
            }}
          >
            <AlertTriangle size={14} />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Product &amp; SKU</th>
                <th style={{ padding: "0.75rem 1rem" }}>Category</th>
                <th style={{ padding: "0.75rem 1rem" }}>Current Stock</th>
                <th style={{ padding: "0.75rem 1rem" }}>Threshold / Reorder</th>
                <th style={{ padding: "0.75rem 1rem" }}>Unit Cost / Price</th>
                <th style={{ padding: "0.75rem 1rem" }}>Velocity &amp; Stockout</th>
                <th style={{ padding: "0.75rem 1rem" }}>Preferred Supplier</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <Package size={36} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
                    <p style={{ fontWeight: 600 }}>No products found</p>
                    <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                      Add your first product to begin tracking inventory and stock movements.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.reorderThreshold;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        backgroundColor: isLow ? "rgba(173, 72, 43, 0.03)" : "transparent",
                      }}
                    >
                      {/* Product Name & SKU */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-ink)" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {p.sku} {p.storageLocation ? `&bull; ${p.storageLocation}` : ""}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span className="badge badge-muted">{p.category}</span>
                      </td>

                      {/* Current Stock */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "1rem",
                              color: isLow ? "var(--accent-terracotta)" : "var(--brand-forest)",
                            }}
                          >
                            {p.currentStock}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.unitOfMeasure}</span>
                          {isLow && (
                            <span className="badge badge-terracotta" style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}>
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Threshold & Preferred Reorder */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                          Min: {p.reorderThreshold} {p.unitOfMeasure}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Reorder: +{p.preferredReorderQuantity}
                        </div>
                      </td>

                      {/* Cost / Price */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                          Price: ₹{p.sellingPrice.toFixed(2)}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Cost: ₹{p.unitCost.toFixed(2)}
                        </div>
                      </td>

                      {/* Velocity & Stockout Forecast */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {p.salesVelocityPerDay && p.salesVelocityPerDay > 0 ? (
                          <div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                              ~{p.salesVelocityPerDay}/day (30d)
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: (p.estimatedDaysUntilStockout ?? 99) <= 7 ? "var(--accent-terracotta)" : "var(--text-muted)",
                              }}
                            >
                              {p.estimatedDaysUntilStockout !== null
                                ? `~${p.estimatedDaysUntilStockout} days until stockout`
                                : "History insufficient"}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
                            Insufficient sales data
                          </span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                        {p.supplierName}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem" }}>
                          <button
                            onClick={() => openAdjustModal(p)}
                            title="Adjust Stock"
                            style={{
                              padding: "0.3rem 0.55rem",
                              borderRadius: "var(--radius-xs)",
                              backgroundColor: "var(--surface-subtle)",
                              border: "1px solid var(--border-medium)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleViewMovements(p)}
                            title="View Ledger Audit History"
                            style={{
                              padding: "0.3rem 0.45rem",
                              borderRadius: "var(--radius-xs)",
                              color: "var(--text-muted)",
                            }}
                          >
                            <History size={15} />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            style={{
                              padding: "0.3rem 0.45rem",
                              borderRadius: "var(--radius-xs)",
                              color: "var(--text-muted)",
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            title="Archive Product"
                            style={{
                              padding: "0.3rem 0.45rem",
                              borderRadius: "var(--radius-xs)",
                              color: "var(--accent-rose)",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(28, 25, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--accent-rose-light)",
                  border: "1px solid var(--accent-rose-border)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--accent-rose)",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    placeholder="pcs, rolls, kg, boxes"
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              {!editingProduct && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Opening Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Storage Location</label>
                    <input
                      type="text"
                      value={formData.storageLocation}
                      onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                      placeholder="e.g. Shelf B-04"
                      style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData({ ...formData, reorderThreshold: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Preferred Reorder Qty</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.preferredReorderQuantity}
                    onChange={(e) => setFormData({ ...formData, preferredReorderQuantity: parseFloat(e.target.value) || 1 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Unit Purchase Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Preferred Supplier</label>
                <select
                  value={formData.preferredSupplierId}
                  onChange={(e) => setFormData({ ...formData, preferredSupplierId: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", backgroundColor: "#FFFFFF" }}
                >
                  <option value="">-- No Supplier Assigned --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactName || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK ADJUSTMENT */}
      {adjustingProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(28, 25, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              maxWidth: "480px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
                  Adjust Stock: {adjustingProduct.name}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Current balance: {adjustingProduct.currentStock} {adjustingProduct.unitOfMeasure}
                </p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--accent-rose-light)",
                  border: "1px solid var(--accent-rose-border)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--accent-rose)",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleExecuteAdjustment} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Movement Type</label>
                <select
                  value={adjustData.movementType}
                  onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value as MovementType })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", backgroundColor: "#FFFFFF" }}
                >
                  <option value="manual_adjustment">Manual Inventory Correction</option>
                  <option value="stock_receipt">Stock Receipt (Received Delivery)</option>
                  <option value="return">Customer Return</option>
                  <option value="damage_writeoff">Damaged / Written-Off Stock</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                  Quantity Change (+ for increase, - for decrease) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustData.quantityChange}
                  onChange={(e) => setAdjustData({ ...adjustData, quantityChange: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Expected new stock:{" "}
                  <strong>
                    {Math.max(0, adjustingProduct.currentStock + Number(adjustData.quantityChange))} {adjustingProduct.unitOfMeasure}
                  </strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                  Audit Reason (Required) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical cycle count discrepancy, damaged packaging, supplier drop"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setAdjustingProduct(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDITABLE STOCK LEDGER HISTORY */}
      {selectedProductMovements && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(28, 25, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-md)",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                  Stock Ledger: {selectedProductMovements.product.name}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Auditable chronological record of all stock adjustments, sales, and receipts
                </p>
              </div>
              <button onClick={() => setSelectedProductMovements(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {selectedProductMovements.movements.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No stock movements recorded for this item.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.5rem" }}>Date / Time</th>
                    <th style={{ padding: "0.5rem" }}>Type</th>
                    <th style={{ padding: "0.5rem" }}>Reason</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Change</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductMovements.movements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.55rem 0.5rem", color: "var(--text-muted)" }}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.55rem 0.5rem" }}>
                        <span className="badge badge-muted" style={{ fontSize: "0.65rem" }}>
                          {m.movementType.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "0.55rem 0.5rem", color: "var(--text-ink)" }}>{m.reason}</td>
                      <td
                        style={{
                          padding: "0.55rem 0.5rem",
                          textAlign: "right",
                          fontWeight: 700,
                          color: m.quantityChange > 0 ? "#15803d" : "var(--accent-terracotta)",
                        }}
                      >
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                      <td style={{ padding: "0.55rem 0.5rem", textAlign: "right", fontWeight: 600 }}>
                        {m.quantityAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button onClick={() => setSelectedProductMovements(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
