"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Supplier,
  SupplierEmailDraft,
  Product,
  RestockOrder,
} from "@/types/operations";
import {
  Truck,
  Plus,
  Mail,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  Sparkles,
  Package,
  X,
  FileText,
  RefreshCw,
  Info,
} from "lucide-react";

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "drafts" | "orders" | "research">("directory");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drafts, setDrafts] = useState<SupplierEmailDraft[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<RestockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingDraft, setEditingDraft] = useState<SupplierEmailDraft | null>(null);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<RestockOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  // Supplier Form Data
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    leadTimeDays: 7,
    minOrderQuantity: 100,
    minOrderValue: 5000,
    notes: "",
  });

  // PO Form Data
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItems, setPoItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [poNotes, setPoNotes] = useState("");

  // TinyFish Supplier Research State
  const [researchQuery, setResearchQuery] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchResult, setResearchResult] = useState<any | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingDraftId, setSendingDraftId] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setDbError(null);
      const url = new URL("/api/operations/suppliers", window.location.origin);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        setDbError(data.error || `Database error (${res.status})`);
      } else {
        setSuppliers(data.suppliers || []);
      }
    } catch (err: any) {
      setDbError(err.message || "Failed to connect to database service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/operations/emails");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch {}
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

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/operations/restock");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSuppliers();
    fetchDrafts();
    fetchProducts();
    fetchOrders();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as "directory" | "drafts" | "orders" | "research" | null;
      if (tabParam && ["directory", "drafts", "orders", "research"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const qParam = params.get("q");
      if (qParam) {
        setResearchQuery(qParam);
        setActiveTab("research");
      }
      const draftId = params.get("draftId");
      if (draftId) {
        setActiveTab("drafts");
      }
      const orderId = params.get("orderId");
      if (orderId) {
        setActiveTab("orders");
      }
      const reorderSupplierId = params.get("reorderSupplierId");
      if (reorderSupplierId) {
        setPoSupplierId(reorderSupplierId);
        setShowCreatePOModal(true);
        setActiveTab("orders");
      }
      const editSupplierId = params.get("editSupplierId");
      if (editSupplierId) {
        setActiveTab("directory");
      }
    }
  }, []);

  // Save Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim() || !supplierForm.email.trim()) {
      setToast({ type: "error", text: "Supplier name and email are required." });
      return;
    }

    try {
      if (editingSupplier) {
        const res = await fetch("/api/operations/suppliers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSupplier.id, ...supplierForm }),
        });
        const data = await res.json();
        if (res.ok) {
          setToast({ type: "success", text: `Supplier "${supplierForm.name}" updated.` });
          setShowAddSupplierModal(false);
          fetchSuppliers();
        } else {
          setToast({ type: "error", text: data.error || "Update failed." });
        }
      } else {
        const res = await fetch("/api/operations/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierForm),
        });
        const data = await res.json();
        if (res.ok) {
          setToast({ type: "success", text: `Supplier "${supplierForm.name}" added.` });
          setShowAddSupplierModal(false);
          fetchSuppliers();
        } else {
          setToast({ type: "error", text: data.error || "Creation failed." });
        }
      }
    } catch {
      setToast({ type: "error", text: "Network error saving supplier." });
    }
  };

  // Archive Supplier
  const handleArchiveSupplier = async (id: string, name: string) => {
    if (!confirm(`Archive supplier "${name}"? Existing products will preserve historical associations.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/operations/suppliers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", text: `Supplier "${name}" archived.` });
        fetchSuppliers();
      }
    } catch {}
  };

  // Approve and Dispatch Email (Requires Explicit Approval)
  const handleApproveAndSendEmail = async (draftId: string) => {
    if (!confirm("Are you sure you want to approve and send this restock inquiry email to the supplier?")) {
      return;
    }

    try {
      setSendingDraftId(draftId);
      const res = await fetch("/api/operations/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId, approved: true }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.success) {
          setToast({ type: "success", text: data.message });
        } else {
          // Handled missing provider state
          setToast({ type: "error", text: data.message });
        }
        fetchDrafts();
      } else {
        setToast({ type: "error", text: data.error || "Failed to process approval." });
      }
    } catch {
      setToast({ type: "error", text: "Network error during email dispatch." });
    } finally {
      setSendingDraftId(null);
    }
  };

  // Save Edited Email Draft
  const handleSaveDraftChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;

    try {
      const res = await fetch("/api/operations/emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDraft.id,
          subject: editingDraft.subject,
          body: editingDraft.body,
          recipientEmail: editingDraft.recipientEmail,
        }),
      });

      if (res.ok) {
        setToast({ type: "success", text: "Email draft updated." });
        setEditingDraft(null);
        fetchDrafts();
      }
    } catch {}
  };

  // Create Restock PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || poItems.length === 0) {
      setToast({ type: "error", text: "Please select a supplier and at least one item." });
      return;
    }

    try {
      const res = await fetch("/api/operations/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: poSupplierId, items: poItems, notes: poNotes }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", text: `Restock order ${data.order.orderNumber} created.` });
        setShowCreatePOModal(false);
        fetchOrders();
      } else {
        setToast({ type: "error", text: data.error || "Failed to create restock order." });
      }
    } catch {
      setToast({ type: "error", text: "Network error creating PO." });
    }
  };

  // Receive Restock Stock
  const handleConfirmStockReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;

    try {
      const res = await fetch(`/api/operations/restock/${receivingOrder.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedQuantities: receivedQtys }),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({
          type: "success",
          text: `Stock receipt recorded for ${receivingOrder.orderNumber}. Inventory quantities increased.`,
        });
        setReceivingOrder(null);
        fetchOrders();
        fetchProducts();
      } else {
        setToast({ type: "error", text: data.error || "Failed to record receipt." });
      }
    } catch {
      setToast({ type: "error", text: "Network error recording receipt." });
    }
  };

  // Run TinyFish Supplier Research
  const handleRunSupplierResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuery.trim()) return;

    try {
      setResearchLoading(true);
      setResearchError(null);
      setResearchResult(null);

      const res = await fetch("/api/operations/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "supplier",
          query: researchQuery,
          notes: researchNotes,
          region: "IN",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResearchResult(data.result);
      } else {
        setResearchError(data.error || "TinyFish research failed.");
      }
    } catch {
      setResearchError("Network failure connecting to research endpoint.");
    } finally {
      setResearchLoading(false);
    }
  };

  // Transfer Discovered Research Info into Supplier Form
  const handleImportResearchedSupplier = () => {
    if (!researchResult) return;
    setEditingSupplier(null);
    setSupplierForm({
      name: researchResult.supplierName || researchQuery,
      contactName: "",
      email: researchResult.publicContactEmail || "",
      phone: researchResult.publicPhone || "",
      website: researchResult.websiteCandidate || "",
      leadTimeDays: 7,
      minOrderQuantity: 100,
      minOrderValue: 5000,
      notes: `Discovered via TinyFish Web Intelligence (${new Date().toLocaleDateString()}). Highlights: ${researchResult.catalogHighlights?.slice(0, 2).join("; ")}`,
    });
    setShowAddSupplierModal(true);
  };

  return (
    <AppShell
      title="Suppliers & Restock Operations"
      subtitle="Supplier directory, automated low-stock drafts, purchase orders, and TinyFish research"
      action={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => {
              setEditingSupplier(null);
              setSupplierForm({
                name: "",
                contactName: "",
                email: "",
                phone: "",
                website: "",
                leadTimeDays: 7,
                minOrderQuantity: 100,
                minOrderValue: 5000,
                notes: "",
              });
              setShowAddSupplierModal(true);
            }}
            className="btn-primary"
            style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
          >
            <Plus size={14} />
            Add Supplier
          </button>
        </div>
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
            onClick={() => { fetchSuppliers(); fetchDrafts(); fetchOrders(); }}
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
      {toast && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.65rem 1rem",
            backgroundColor: toast.type === "success" ? "var(--brand-forest-light)" : "var(--accent-rose-light)",
            border: `1px solid ${toast.type === "success" ? "var(--brand-forest-border)" : "var(--accent-rose-border)"}`,
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            color: toast.type === "success" ? "var(--brand-forest)" : "var(--accent-rose)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* MODULE NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-medium)",
          marginBottom: "1.5rem",
          gap: "1.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("directory")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "directory" ? 600 : 500,
            color: activeTab === "directory" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "directory" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Truck size={16} />
          Supplier Directory ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab("drafts")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "drafts" ? 600 : 500,
            color: activeTab === "drafts" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "drafts" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Mail size={16} />
          Email Drafts &amp; Approval ({drafts.filter((d) => d.status === "draft" || d.status === "approved").length})
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "orders" ? 600 : 500,
            color: activeTab === "orders" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "orders" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Package size={16} />
          Restock Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab("research")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "research" ? 600 : 500,
            color: activeTab === "research" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "research" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Sparkles size={16} color="var(--brand-forest)" />
          TinyFish Supplier Research
        </button>
      </div>

      {/* TAB 1: SUPPLIER DIRECTORY */}
      {activeTab === "directory" && (
        <div>
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
                  <th style={{ padding: "0.75rem 1rem" }}>Supplier Company</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Contact Person</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Contact Email</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Lead Time / MOQ</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Notes</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      <Truck size={36} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
                      <p style={{ fontWeight: 600 }}>No suppliers registered</p>
                      <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Add suppliers to assign preferred vendors and automate restock communication.
                      </p>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-ink)" }}>{s.name}</div>
                        {s.website && (
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.75rem", color: "var(--brand-forest)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.15rem" }}
                          >
                            <span>Website</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-charcoal)" }}>
                        {s.contactName || "—"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <a href={`mailto:${s.email}`} style={{ color: "var(--brand-forest)", fontWeight: 500 }}>
                          {s.email}
                        </a>
                        {s.phone && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.phone}</div>}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                        <div>{s.leadTimeDays} days lead time</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          MOQ: {s.minOrderQuantity} &bull; Min Val: ₹{s.minOrderValue}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "240px" }}>
                        {s.notes || "—"}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            onClick={() => {
                              setEditingSupplier(s);
                              setSupplierForm({
                                name: s.name,
                                contactName: s.contactName || "",
                                email: s.email,
                                phone: s.phone || "",
                                website: s.website || "",
                                leadTimeDays: s.leadTimeDays,
                                minOrderQuantity: s.minOrderQuantity,
                                minOrderValue: s.minOrderValue,
                                notes: s.notes || "",
                              });
                              setShowAddSupplierModal(true);
                            }}
                            title="Edit Supplier"
                            style={{ padding: "0.3rem", color: "var(--text-muted)" }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleArchiveSupplier(s.id, s.name)}
                            title="Archive Supplier"
                            style={{ padding: "0.3rem", color: "var(--accent-rose)" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER EMAIL DRAFTS & APPROVAL */}
      {activeTab === "drafts" && (
        <div>
          <div
            style={{
              padding: "0.85rem 1rem",
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.85rem",
              color: "var(--text-charcoal)",
            }}
          >
            <Info size={18} color="var(--brand-forest)" />
            <span>
              <strong>Zero-Surprise Email Policy:</strong> Oppora never sends external communications automatically.
              Drafts are generated when products fall below reorder thresholds and require your explicit review and approval.
            </span>
          </div>

          {drafts.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", padding: "3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle2 size={36} color="#22c55e" style={{ margin: "0 auto 0.5rem" }} />
              <p style={{ fontWeight: 600 }}>No restock drafts awaiting review</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                When any product stock level reaches or drops below its threshold, an automated reviewable draft is prepared here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem",
                    boxShadow: "var(--shadow-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          className={`badge ${
                            d.status === "sent"
                              ? "badge-forest"
                              : d.status === "failed"
                              ? "badge-rose"
                              : d.status === "approved"
                              ? "badge-amber"
                              : "badge-muted"
                          }`}
                        >
                          Status: {d.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Created: {new Date(d.createdAt || "").toLocaleString()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-ink)", marginTop: "0.35rem" }}>
                        {d.subject}
                      </h3>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        Recipient: <strong>{d.recipientName}</strong> &lt;{d.recipientEmail}&gt;
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {d.status !== "sent" && (
                        <>
                          <button
                            onClick={() => setEditingDraft(d)}
                            className="btn-secondary"
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
                          >
                            <Edit2 size={14} />
                            Edit Draft
                          </button>
                          <button
                            onClick={() => handleApproveAndSendEmail(d.id)}
                            disabled={sendingDraftId === d.id}
                            className="btn-primary"
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
                          >
                            <Send size={14} />
                            {sendingDraftId === d.id ? "Sending..." : "Approve & Send Email"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reason Pill */}
                  <div style={{ fontSize: "0.78rem", color: "var(--accent-terracotta)", fontWeight: 500, marginBottom: "0.75rem" }}>
                    Trigger Reason: {d.reason}
                  </div>

                  {/* Body Preview */}
                  <pre
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      padding: "0.85rem",
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-sans)",
                      whiteSpace: "pre-wrap",
                      color: "var(--text-charcoal)",
                      lineHeight: 1.5,
                    }}
                  >
                    {d.body}
                  </pre>

                  {d.errorMessage && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <AlertTriangle size={14} />
                      <span>{d.errorMessage}</span>
                    </div>
                  )}

                  {d.providerMessageId && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--brand-forest)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CheckCircle2 size={14} />
                      <span>Provider Message ID: {d.providerMessageId}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESTOCK PURCHASE ORDERS & RECEIPT WORKFLOW */}
      {activeTab === "orders" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Create lightweight restock orders and receive stock into the inventory ledger when deliveries arrive.
            </p>
            <button
              onClick={() => {
                const low = products.filter((p) => p.currentStock <= p.reorderThreshold);
                setPoSupplierId(suppliers[0]?.id || "");
                setPoItems(
                  low.length > 0
                    ? low.map((p) => ({ productId: p.id, quantity: p.preferredReorderQuantity || 50 }))
                    : [{ productId: products[0]?.id || "", quantity: 50 }]
                );
                setShowCreatePOModal(true);
              }}
              className="btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
            >
              <Plus size={14} />
              Create Restock PO
            </button>
          </div>

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
                  <th style={{ padding: "0.75rem 1rem" }}>PO Number</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Supplier</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Items Requested</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Est. Total</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                      <FileText size={36} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
                      <p style={{ fontWeight: 600 }}>No restock orders created yet</p>
                      <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Generate a restock PO from low-stock items and record received stock upon delivery.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "var(--text-ink)" }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "var(--text-charcoal)" }}>{o.supplierName}</td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem" }}>
                          {o.items.map((it) => `${it.productName} (${it.quantityReceived}/${it.quantityRequested})`).join(", ")}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          className={`badge ${
                            o.status === "received"
                              ? "badge-forest"
                              : o.status === "partially_received"
                              ? "badge-amber"
                              : "badge-muted"
                          }`}
                        >
                          {o.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 600 }}>
                        ₹{o.totalEstimatedCost.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        {o.status !== "received" && (
                          <button
                            onClick={() => {
                              setReceivingOrder(o);
                              const initialQtys: Record<string, number> = {};
                              o.items.forEach((it) => {
                                initialQtys[it.productId] = it.quantityRequested - it.quantityReceived;
                              });
                              setReceivedQtys(initialQtys);
                            }}
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                          >
                            Receive Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TINYFISH SUPPLIER RESEARCH */}
      {activeTab === "research" && (
        <div style={{ maxWidth: "800px" }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Sparkles size={20} color="var(--brand-forest)" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                Live Supplier &amp; Manufacturer Research
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Research public manufacturer catalogs, verified official websites, and authoritative business contact
              details powered by TinyFish Search &amp; Fetch agents.
            </p>

            <form onSubmit={handleRunSupplierResearch} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BioPack Industries, GreenEarth Packaging India"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                  Specific Focus or Product Category (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Compostable food pouches, thermal labels, Bangalore factory"
                  value={researchNotes}
                  onChange={(e) => setResearchNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div>
                <button type="submit" disabled={researchLoading} className="btn-primary" style={{ padding: "0.55rem 1.25rem" }}>
                  <Sparkles size={15} />
                  {researchLoading ? "Running TinyFish Live Research..." : "Start Supplier Web Research"}
                </button>
              </div>
            </form>

            {researchError && (
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--accent-rose-light)",
                  border: "1px solid var(--accent-rose-border)",
                  borderRadius: "var(--radius-xs)",
                  color: "var(--accent-rose)",
                  fontSize: "0.85rem",
                }}
              >
                {researchError}
              </div>
            )}

            {/* Research Results Card */}
            {researchResult && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  backgroundColor: "var(--surface-subtle)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600, color: "var(--brand-forest)" }}>
                      Discovered: {researchResult.supplierName}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Retrieved: {new Date(researchResult.retrievedAt).toLocaleTimeString()} &bull; Live Web Intelligence
                    </div>
                  </div>
                  <button onClick={handleImportResearchedSupplier} className="btn-primary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}>
                    + Save to Directory
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem", fontSize: "0.84rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Official Website: </span>
                    {researchResult.websiteCandidate ? (
                      <a href={researchResult.websiteCandidate} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-forest)", fontWeight: 600 }}>
                        {researchResult.websiteCandidate}
                      </a>
                    ) : (
                      "Not found"
                    )}
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Public Contact Email: </span>
                    <strong>{researchResult.publicContactEmail || "Unlisted on public pages"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Public Phone: </span>
                    <strong>{researchResult.publicPhone || "Unlisted on public pages"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Lead Time Note: </span>
                    <span>{researchResult.leadTimeOrDeliveryInfo}</span>
                  </div>
                </div>

                {/* Catalog Highlights */}
                {researchResult.catalogHighlights && researchResult.catalogHighlights.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)", marginBottom: "0.35rem" }}>
                      Catalog &amp; Product Highlights:
                    </div>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.82rem", color: "var(--text-charcoal)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {researchResult.catalogHighlights.map((line: string, idx: number) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verified vs Inferred Details */}
                <div style={{ borderTop: "1px solid var(--border-medium)", paddingTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div>
                    <strong>Sources Inspected:</strong>{" "}
                    {researchResult.sourceUrls?.map((u: string, idx: number) => (
                      <a key={idx} href={u} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-forest)", textDecoration: "underline", marginRight: "0.5rem" }}>
                        [Source {idx + 1}]
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SUPPLIER */}
      {showAddSupplierModal && (
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
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Contact Person</label>
                  <input
                    type="text"
                    value={supplierForm.contactName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Phone</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Website URL</label>
                <input
                  type="url"
                  placeholder="https://"
                  value={supplierForm.website}
                  onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={supplierForm.leadTimeDays}
                    onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value) || 1 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Min Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={supplierForm.minOrderQuantity}
                    onChange={(e) => setSupplierForm({ ...supplierForm, minOrderQuantity: parseInt(e.target.value) || 1 })}
                    style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Notes</label>
                <textarea
                  rows={2}
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSupplier ? "Save Changes" : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMAIL DRAFT */}
      {editingDraft && (
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
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                Edit Restock Inquiry Draft
              </h3>
              <button onClick={() => setEditingDraft(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDraftChanges} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Recipient Email</label>
                <input
                  type="email"
                  required
                  value={editingDraft.recipientEmail}
                  onChange={(e) => setEditingDraft({ ...editingDraft, recipientEmail: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Subject</label>
                <input
                  type="text"
                  required
                  value={editingDraft.subject}
                  onChange={(e) => setEditingDraft({ ...editingDraft, subject: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Email Body</label>
                <textarea
                  rows={8}
                  required
                  value={editingDraft.body}
                  onChange={(e) => setEditingDraft({ ...editingDraft, body: e.target.value })}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", fontFamily: "var(--font-sans)", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" onClick={() => setEditingDraft(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE RESTOCK PO */}
      {showCreatePOModal && (
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
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                Create Restock Purchase Order
              </h3>
              <button onClick={() => setShowCreatePOModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePO} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Supplier *</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", backgroundColor: "#FFFFFF" }}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactName || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Items &amp; Quantities</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.3rem" }}>
                  {poItems.map((it, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "0.5rem" }}>
                      <select
                        value={it.productId}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].productId = e.target.value;
                          setPoItems(updated);
                        }}
                        style={{ padding: "0.35rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = parseFloat(e.target.value) || 1;
                          setPoItems(updated);
                        }}
                        style={{ padding: "0.35rem", fontSize: "0.82rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-charcoal)" }}>PO Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery required by next Friday"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.45rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowCreatePOModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIVE RESTOCK STOCK */}
      {receivingOrder && (
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
              maxWidth: "500px",
              width: "100%",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600 }}>
                  Receive Stock: {receivingOrder.orderNumber}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Enter delivered quantities to increase inventory balances and record audit receipts
                </p>
              </div>
              <button onClick={() => setReceivingOrder(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmStockReceipt} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {receivingOrder.items.map((it) => (
                <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", backgroundColor: "var(--surface-subtle)", borderRadius: "var(--radius-xs)" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{it.productName}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Requested: {it.quantityRequested} &bull; Prev Received: {it.quantityReceived}
                    </div>
                  </div>
                  <div style={{ width: "90px" }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={receivedQtys[it.productId] ?? 0}
                      onChange={(e) =>
                        setReceivedQtys({
                          ...receivedQtys,
                          [it.productId]: parseFloat(e.target.value) || 0,
                        })
                      }
                      style={{ width: "100%", padding: "0.35rem", fontSize: "0.85rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)" }}
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setReceivingOrder(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Stock Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
