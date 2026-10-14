"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Sale, Product } from "@/types/operations";
import {
  TrendingUp,
  Plus,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
  RotateCcw,
  Eye,
  Filter,
} from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // New Sale Form
  const [saleItems, setSaleItems] = useState<
    Array<{ productId: string; quantity: number; unitPrice: number }>
  >([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending" | "Partial" | "Refunded">("Paid");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customerNote, setCustomerNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch(`/api/operations/sales?period=${period}`);
      const data = await res.json();
      if (!res.ok) {
        setDbError(data.error || `Database error (${res.status})`);
      } else {
        setSales(data.sales || []);
      }
    } catch (err: any) {
      setDbError(err.message || "Failed to connect to database service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/operations/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [period]);

  const openCreateModal = () => {
    setSaleItems([
      {
        productId: products[0]?.id || "",
        quantity: 1,
        unitPrice: products[0]?.sellingPrice || 0,
      },
    ]);
    setDiscountAmount(0);
    setPaymentMethod("Bank Transfer");
    setPaymentStatus("Paid");
    setCustomerNote("");
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleProductSelectChange = (idx: number, productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    const updated = [...saleItems];
    updated[idx] = {
      productId,
      quantity: updated[idx].quantity || 1,
      unitPrice: p ? p.sellingPrice : 0,
    };
    setSaleItems(updated);
  };

  const handleItemQtyChange = (idx: number, qty: number) => {
    const updated = [...saleItems];
    updated[idx].quantity = Math.max(1, qty);
    setSaleItems(updated);
  };

  const handleItemPriceChange = (idx: number, price: number) => {
    const updated = [...saleItems];
    updated[idx].unitPrice = Math.max(0, price);
    setSaleItems(updated);
  };

  const addItemRow = () => {
    setSaleItems([
      ...saleItems,
      {
        productId: products[0]?.id || "",
        quantity: 1,
        unitPrice: products[0]?.sellingPrice || 0,
      },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (saleItems.length <= 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== idx));
  };

  // Calculate live preview subtotal
  const liveSubtotal = saleItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const liveTotal = Math.max(0, liveSubtotal - (discountAmount || 0));

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate that items have products
    for (const it of saleItems) {
      if (!it.productId) {
        setFormError("Please select a valid product for every item.");
        return;
      }
      const prod = products.find((p) => p.id === it.productId);
      if (prod && prod.currentStock < it.quantity) {
        setFormError(
          `Cannot record sale: Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unitOfMeasure}, Requested: ${it.quantity}`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/operations/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: saleItems,
          discountAmount: Number(discountAmount) || 0,
          paymentMethod,
          paymentStatus,
          customerNote,
          idempotencyKey: `sale-sub-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Sale "${data.sale.saleNumber}" recorded successfully. Inventory updated.`);
        setShowCreateModal(false);
        fetchSales();
        fetchProducts(); // Refresh products with newly reduced stock
      } else {
        setFormError(data.error || "Failed to record sale.");
      }
    } catch {
      setFormError("Network failure recording sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Reverse Sale Workflow
  const handleConfirmCancelSale = async () => {
    if (!cancellingSale) return;
    try {
      const res = await fetch(`/api/operations/sales/${cancellingSale.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Customer cancellation / return" }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Sale "${cancellingSale.saleNumber}" cancelled. Stock restored to inventory ledger.`);
        setCancellingSale(null);
        setCancelReason("");
        fetchSales();
        fetchProducts();
      } else {
        alert(data.error || "Failed to cancel sale.");
      }
    } catch {
      alert("Network failure reversing sale.");
    }
  };

  // Analytics derivations
  const completedSales = sales.filter((s) => s.status === "completed");
  const totalRevenue = completedSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCost = completedSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const totalUnits = completedSales.reduce((acc, s) => acc + s.items.reduce((iacc, i) => iacc + i.quantity, 0), 0);
  const estimatedGrossProfit = totalCost > 0 ? totalRevenue - totalCost : null;

  return (
    <AppShell
      title="Sales & Revenue Records"
      subtitle="Accurate transaction history, historical cost snapshots, and automatic stock deduction"
      action={
        <button onClick={openCreateModal} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}>
          <Plus size={14} />
          Record Sale
        </button>
      }
    >
      {/* Database Error Alert */}
      {dbError && (
        <div
          style={{
            marginBottom: "1.25rem",
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
            onClick={() => { fetchSales(); fetchProducts(); }}
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

      {/* Toast */}
      {toastMessage && (
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
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} style={{ fontSize: "0.75rem", color: "var(--brand-forest)", fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ANALYTICS SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ backgroundColor: "#FFFFFF", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Revenue
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.65rem", fontWeight: 600, color: "var(--text-ink)", marginTop: "0.25rem" }}>
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {completedSales.length} completed transactions
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Units Sold
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.65rem", fontWeight: 600, color: "var(--text-ink)", marginTop: "0.25rem" }}>
            {totalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Across all products in period
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Estimated Gross Profit
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.65rem", fontWeight: 600, color: "var(--brand-forest)", marginTop: "0.25rem" }}>
            {estimatedGrossProfit !== null ? `₹${estimatedGrossProfit.toLocaleString()}` : "N/A"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Revenue minus snapshot unit costs
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Average Order Value
          </div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.65rem", fontWeight: 600, color: "var(--text-ink)", marginTop: "0.25rem" }}>
            ₹{completedSales.length > 0 ? Math.round(totalRevenue / completedSales.length).toLocaleString() : 0}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Per recorded order
          </div>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
          Sales Transaction History
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "0.25rem 0.65rem",
                fontSize: "0.78rem",
                fontWeight: period === p ? 600 : 500,
                backgroundColor: period === p ? "var(--brand-forest)" : "#FFFFFF",
                color: period === p ? "#FFFFFF" : "var(--text-charcoal)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-medium)",
              }}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      {/* SALES TABLE */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--surface-subtle)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Order #</th>
              <th style={{ padding: "0.75rem 1rem" }}>Date</th>
              <th style={{ padding: "0.75rem 1rem" }}>Items</th>
              <th style={{ padding: "0.75rem 1rem" }}>Payment</th>
              <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Total</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Est. Profit</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading sales records...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <TrendingUp size={36} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
                  <p style={{ fontWeight: 600 }}>No sales recorded in this period</p>
                  <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    Click &quot;Record Sale&quot; to log a client sale and deduct units from inventory.
                  </p>
                </td>
              </tr>
            ) : (
              sales.map((s) => {
                const profit = s.status === "completed" && s.totalCost > 0 ? s.totalAmount - s.totalCost : null;
                const isCancelled = s.status === "cancelled";
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: isCancelled ? "rgba(100, 100, 100, 0.03)" : "transparent",
                      opacity: isCancelled ? 0.65 : 1,
                    }}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-ink)" }}>
                      {s.saleNumber}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {new Date(s.saleDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ fontSize: "0.85rem" }}>
                        {s.items[0]?.productName}
                        {s.items.length > 1 && ` +${s.items.length - 1} more`}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {s.items.reduce((acc, it) => acc + it.quantity, 0)} total units
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem" }}>
                      <div>{s.paymentMethod}</div>
                      <span className="badge badge-forest" style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {isCancelled ? (
                        <span className="badge badge-rose" style={{ fontSize: "0.68rem" }}>
                          Cancelled &amp; Restocked
                        </span>
                      ) : (
                        <span className="badge badge-forest" style={{ fontSize: "0.68rem" }}>
                          Completed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--text-ink)" }}>
                      ₹{s.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right", color: "var(--brand-forest)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {profit !== null ? `₹${profit.toLocaleString()}` : "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <button
                          onClick={() => setViewingSale(s)}
                          title="View Details"
                          style={{ color: "var(--text-muted)", padding: "0.3rem" }}
                        >
                          <Eye size={16} />
                        </button>
                        {!isCancelled && (
                          <button
                            onClick={() => {
                              setCancellingSale(s);
                              setCancelReason("");
                            }}
                            title="Cancel & Reverse Stock"
                            style={{ color: "var(--accent-terracotta)", padding: "0.3rem" }}
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: RECORD SALE FORM */}
      {showCreateModal && (
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
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                Record New Sale
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ color: "var(--text-muted)" }}>
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

            <form onSubmit={handleCreateSale} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                    Line Items (Products &amp; Quantities)
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    style={{ fontSize: "0.75rem", color: "var(--brand-forest)", fontWeight: 600 }}
                  >
                    + Add Product
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {saleItems.map((item, idx) => {
                    const selProd = products.find((p) => p.id === item.productId);
                    const isExceeding = selProd && selProd.currentStock < item.quantity;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "3fr 1fr 1.5fr auto",
                          gap: "0.5rem",
                          alignItems: "center",
                          padding: "0.5rem",
                          backgroundColor: "var(--surface-subtle)",
                          borderRadius: "var(--radius-xs)",
                          border: isExceeding ? "1px solid var(--accent-rose)" : "1px solid var(--border-subtle)",
                        }}
                      >
                        <div>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelectChange(idx, e.target.value)}
                            style={{ width: "100%", padding: "0.35rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Available: {p.currentStock} {p.unitOfMeasure})
                              </option>
                            ))}
                          </select>
                          {isExceeding && (
                            <div style={{ fontSize: "0.7rem", color: "var(--accent-rose)", marginTop: "0.15rem" }}>
                              Exceeds stock ({selProd.currentStock} {selProd.unitOfMeasure} available)
                            </div>
                          )}
                        </div>

                        <div>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(idx, parseFloat(e.target.value) || 1)}
                            style={{ width: "100%", padding: "0.35rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                          />
                        </div>

                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                            style={{ width: "100%", padding: "0.35rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={saleItems.length <= 1}
                          style={{ color: saleItems.length <= 1 ? "var(--text-faint)" : "var(--accent-rose)", padding: "0.25rem" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div
                style={{
                  backgroundColor: "var(--surface-parchment-deep)",
                  padding: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Subtotal: ₹{liveSubtotal.toFixed(2)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Discount: ₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      style={{ width: "80px", padding: "0.2rem 0.4rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Final Sale Total</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-forest)" }}>
                    ₹{liveTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Razorpay / Card">Razorpay / Card</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Customer / Invoice Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. CleanFoods Bangalore batch order, Invoice #INV-88"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? "Recording..." : "Confirm & Record Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SALE DETAILS */}
      {viewingSale && (
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
              maxWidth: "540px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", fontWeight: 600 }}>
                  Sale Receipt: {viewingSale.saleNumber}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Recorded: {new Date(viewingSale.saleDate).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setViewingSale(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-charcoal)" }}>
              <div>Payment: {viewingSale.paymentMethod} &bull; Status: {viewingSale.paymentStatus}</div>
              {viewingSale.customerNote && <div style={{ marginTop: "0.25rem", color: "var(--text-muted)" }}>Note: {viewingSale.customerNote}</div>}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.4rem 0" }}>Product</th>
                  <th style={{ padding: "0.4rem 0", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "0.4rem 0", textAlign: "right" }}>Unit Price</th>
                  <th style={{ padding: "0.4rem 0", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewingSale.items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.45rem 0", fontWeight: 500 }}>{it.productName}</td>
                    <td style={{ padding: "0.45rem 0", textAlign: "right" }}>{it.quantity}</td>
                    <td style={{ padding: "0.45rem 0", textAlign: "right" }}>₹{it.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: "0.45rem 0", textAlign: "right", fontWeight: 600 }}>₹{it.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: "right", borderTop: "2px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total Paid:</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 700, color: "var(--brand-forest)" }}>
                ₹{viewingSale.totalAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button onClick={() => setViewingSale(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL & REVERSE SALE CONFIRMATION */}
      {cancellingSale && (
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
              maxWidth: "460px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-terracotta)", marginBottom: "0.75rem" }}>
              <RotateCcw size={20} />
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
                Cancel &amp; Reverse Sale {cancellingSale.saleNumber}
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-charcoal)", marginBottom: "1rem" }}>
              Cancelling this sale will automatically create an auditable &quot;Customer Return&quot; stock movement in your inventory ledger and restore the units back to available stock.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                Cancellation Reason *
              </label>
              <input
                type="text"
                placeholder="e.g. Order cancelled by customer before dispatch"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={() => setCancellingSale(null)} className="btn-secondary">
                Keep Sale
              </button>
              <button onClick={handleConfirmCancelSale} className="btn-terracotta">
                Confirm Cancellation &amp; Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
