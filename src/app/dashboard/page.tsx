"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  OverviewMetrics,
  Product,
  Sale,
  SupplierEmailDraft,
  StockMovement,
  BusinessAction,
  ActivityEvent,
} from "@/types/operations";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Mail,
  ArrowRight,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Building,
  Sparkles,
  Filter,
  ArrowUpRight,
  Truck,
  Check,
  X,
  ShieldCheck,
  Info,
} from "lucide-react";

function formatRelativeTime(isoDate: string): string {
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingStock, setCheckingStock] = useState<boolean>(false);
  const [stockCheckNotice, setStockCheckNotice] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [actionFilter, setActionFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const fetchMetrics = async (selectedPeriod: "7d" | "30d" | "90d" | "all") => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch(`/api/operations/overview?period=${selectedPeriod}`);
      const data = await res.json();
      if (!res.ok) {
        setDbError(data.error || `Database error (${res.status})`);
      } else {
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (data.isDemo) {
          setIsDemoMode(true);
        }
      }
    } catch (err: any) {
      setDbError(err.message || "Failed to connect to database service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const handleManualStockCheck = async () => {
    try {
      setCheckingStock(true);
      setStockCheckNotice(null);
      const res = await fetch("/api/operations/check-stock", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStockCheckNotice(data.message);
        fetchMetrics(period);
      } else {
        setStockCheckNotice(data.error || "Stock check failed.");
      }
    } catch {
      setStockCheckNotice("Network failure executing stock check.");
    } finally {
      setCheckingStock(false);
    }
  };

  const currencySymbol = metrics?.currency === "USD" ? "$" : metrics?.currency === "EUR" ? "€" : "₹";

  const allActions = metrics?.actions || [];
  const filteredActions = allActions.filter((a) => {
    if (actionFilter === "all") return true;
    return a.severity === actionFilter;
  });

  const timelineEvents = metrics?.activityTimeline || [];
  const isEmptyBusiness = !loading && (metrics?.totalProductsTracked ?? 0) === 0 && (metrics?.unitsSold ?? 0) === 0;

  return (
    <AppShell
      title="Business Overview"
      subtitle="Operational command centre: prioritized bottlenecks, explainable reorder triggers, and audit trail"
      action={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleManualStockCheck}
            disabled={checkingStock}
            className="btn-secondary"
            style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
          >
            <RefreshCw size={14} className={checkingStock ? "spin" : ""} />
            {checkingStock ? "Checking Stock..." : "Check Stock Now"}
          </button>
          <Link
            href="/sales"
            className="btn-primary"
            style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
          >
            <Plus size={14} />
            Record Sale
          </Link>
        </div>
      }
    >
      {/* 1. Database Error Alert */}
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
            onClick={() => fetchMetrics(period)}
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

      {/* 2. Isolated Demo / Storage Mode Indicator */}
      {isDemoMode && !dbError && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.6rem 0.85rem",
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8rem",
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={15} color="#D97706" />
            <span>
              <strong>Development Storage:</strong> Operating with isolated multi-tenant memory store. In production, Supabase PostgreSQL with Row Level Security is required.
            </span>
          </div>
          <Link href="/settings" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#92400E" }}>
            Configure DB &rarr;
          </Link>
        </div>
      )}

      {/* 3. Stock Check Feedback Notice */}
      {stockCheckNotice && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.75rem 1rem",
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
            <span>{stockCheckNotice}</span>
          </div>
          <button
            onClick={() => setStockCheckNotice(null)}
            style={{ fontSize: "0.75rem", color: "var(--brand-forest)", fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Reporting Period Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Reporting Window &amp; Velocity Basis:
        </div>
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            padding: "2px",
          }}
        >
          {(["7d", "30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: period === p ? 600 : 500,
                color: period === p ? "#FFFFFF" : "var(--text-charcoal)",
                backgroundColor: period === p ? "var(--brand-forest)" : "transparent",
                borderRadius: "var(--radius-xs)",
                transition: "all 0.1s ease",
              }}
            >
              {p === "all" ? "All Time" : `Last ${p.replace("d", " Days")}`}
            </button>
          ))}
        </div>
      </div>

      {/* 5. CORE KPI METRICS GRID (4-Column Layout) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {/* Metric 1: Inventory Health */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Inventory Health
            </span>
            <Package size={17} color="var(--brand-forest)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 600, color: "var(--text-ink)" }}>
              {loading ? "..." : metrics?.totalProductsTracked ?? 0}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>products tracked</span>
          </div>
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: (metrics?.lowStockProductsCount ?? 0) > 0 ? "var(--accent-terracotta)" : "var(--text-muted)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              {(metrics?.lowStockProductsCount ?? 0) > 0 && <AlertTriangle size={13} />}
              {metrics?.lowStockProductsCount ?? 0} below threshold
            </span>
            <Link href="/inventory?lowStock=true" style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600 }}>
              Resolve &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 2: Sales Revenue */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Sales Revenue
            </span>
            <TrendingUp size={17} color="var(--brand-forest)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 600, color: "var(--text-ink)" }}>
              {loading ? "..." : `${currencySymbol} ${(metrics?.revenue ?? 0).toLocaleString()}`}
            </span>
          </div>
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-charcoal)" }}>
              {metrics?.unitsSold ?? 0} units sold in period
            </span>
            <Link href="/sales" style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600 }}>
              View sales &rarr;
            </Link>
          </div>
        </div>

        {/* Metric 3: Estimated Gross Profit */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Estimated Gross Profit
            </span>
            <DollarSign size={17} color="var(--brand-forest)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 600, color: "var(--brand-forest)" }}>
              {loading
                ? "..."
                : metrics && metrics.estimatedGrossProfit !== null && metrics.estimatedGrossProfit !== undefined
                ? `${currencySymbol} ${metrics.estimatedGrossProfit.toLocaleString()}`
                : "Cost Unstated"}
            </span>
          </div>
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {metrics?.costDataStatus === "partial" ? "Partial cost history" : "From unit purchase costs"}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>
              Operational metric
            </span>
          </div>
        </div>

        {/* Metric 4: Inventory Valuation */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Inventory Valuation
            </span>
            <Building size={17} color="var(--text-muted)" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 600, color: "var(--text-ink)" }}>
              {loading ? "..." : `${currencySymbol} ${(metrics?.estimatedInventoryValuation ?? 0).toLocaleString()}`}
            </span>
          </div>
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Sum of (stock &times; unit purchase cost)
            </span>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 6. PRIMARY FOCUS: PRIORITIZED BUSINESS ACTION CENTRE ("Needs Your Attention") */}
      {/* ====================================================================== */}
      <div
        id="action-centre"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-card)",
          marginBottom: "2rem",
        }}
      >
        {/* Action Centre Header with Counts and Category Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: (metrics?.actionSummary?.criticalCount ?? 0) > 0 ? "var(--accent-terracotta)" : "#15803d",
                }}
              />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-ink)" }}>
                Needs Your Attention
              </h2>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "12px",
                  backgroundColor: (metrics?.actionSummary?.totalCount ?? 0) > 0 ? "var(--surface-subtle)" : "var(--brand-forest-light)",
                  color: (metrics?.actionSummary?.totalCount ?? 0) > 0 ? "var(--text-ink)" : "var(--brand-forest)",
                }}
              >
                {metrics?.actionSummary?.totalCount ?? 0} {metrics?.actionSummary?.totalCount === 1 ? "Action" : "Actions"}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Proactive operational intelligence grounded in persisted inventory, lead times, POs, and sales velocity
            </p>
          </div>

          {/* Action Filter Pills */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => setActionFilter("all")}
              style={{
                fontSize: "0.78rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-xs)",
                fontWeight: actionFilter === "all" ? 600 : 500,
                border: "1px solid",
                borderColor: actionFilter === "all" ? "var(--brand-forest)" : "var(--border-medium)",
                backgroundColor: actionFilter === "all" ? "var(--brand-forest)" : "transparent",
                color: actionFilter === "all" ? "#FFFFFF" : "var(--text-charcoal)",
                cursor: "pointer",
              }}
            >
              All ({metrics?.actionSummary?.totalCount ?? 0})
            </button>
            <button
              onClick={() => setActionFilter("critical")}
              style={{
                fontSize: "0.78rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-xs)",
                fontWeight: actionFilter === "critical" ? 600 : 500,
                border: "1px solid",
                borderColor: actionFilter === "critical" ? "var(--accent-terracotta)" : "var(--border-medium)",
                backgroundColor: actionFilter === "critical" ? "var(--accent-terracotta)" : "transparent",
                color: actionFilter === "critical" ? "#FFFFFF" : "var(--accent-terracotta)",
                cursor: "pointer",
              }}
            >
              Critical ({metrics?.actionSummary?.criticalCount ?? 0})
            </button>
            <button
              onClick={() => setActionFilter("warning")}
              style={{
                fontSize: "0.78rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-xs)",
                fontWeight: actionFilter === "warning" ? 600 : 500,
                border: "1px solid",
                borderColor: actionFilter === "warning" ? "var(--accent-amber)" : "var(--border-medium)",
                backgroundColor: actionFilter === "warning" ? "var(--accent-amber)" : "transparent",
                color: actionFilter === "warning" ? "#FFFFFF" : "var(--accent-amber)",
                cursor: "pointer",
              }}
            >
              Warnings ({metrics?.actionSummary?.warningCount ?? 0})
            </button>
            <button
              onClick={() => setActionFilter("info")}
              style={{
                fontSize: "0.78rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-xs)",
                fontWeight: actionFilter === "info" ? 600 : 500,
                border: "1px solid",
                borderColor: actionFilter === "info" ? "var(--text-muted)" : "var(--border-medium)",
                backgroundColor: actionFilter === "info" ? "var(--text-muted)" : "transparent",
                color: actionFilter === "info" ? "#FFFFFF" : "var(--text-charcoal)",
                cursor: "pointer",
              }}
            >
              Advisory ({metrics?.actionSummary?.infoCount ?? 0})
            </button>
          </div>
        </div>

        {/* Empty State for New Businesses */}
        {isEmptyBusiness && (
          <div
            style={{
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              backgroundColor: "var(--surface-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px dashed var(--border-medium)",
            }}
          >
            <Compass size={36} color="var(--brand-forest)" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--text-ink)", marginBottom: "0.5rem" }}>
              Welcome to Oppora Startup Operations Copilot
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto 1.5rem" }}>
              Oppora actively protects your venture against stockouts, delayed supplier shipments, and missed funding deadlines. To calibrate your proactive Action Centre, complete your initial setup:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                maxWidth: "680px",
                margin: "0 auto 1.5rem",
                textAlign: "left",
              }}
            >
              <div style={{ padding: "1rem", backgroundColor: "#FFFFFF", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--brand-forest)", marginBottom: "0.3rem" }}>
                  1. Add Products
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Define SKUs, unit purchase costs, and safety stock thresholds in Inventory.
                </div>
              </div>
              <div style={{ padding: "1rem", backgroundColor: "#FFFFFF", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--brand-forest)", marginBottom: "0.3rem" }}>
                  2. Connect Suppliers
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Configure delivery lead times in days to enable lead-time stockout warnings.
                </div>
              </div>
              <div style={{ padding: "1rem", backgroundColor: "#FFFFFF", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--brand-forest)", marginBottom: "0.3rem" }}>
                  3. Record Transactions
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Log sales to establish empirical daily velocity and reorder points.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Link href="/inventory" className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
                Add First Product &rarr;
              </Link>
              <Link href="/suppliers" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
                Configure Suppliers &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Healthy All-Clear State */}
        {!isEmptyBusiness && filteredActions.length === 0 && (
          <div
            style={{
              padding: "2.5rem 1.5rem",
              textAlign: "center",
              backgroundColor: "var(--surface-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <CheckCircle2 size={36} color="#15803d" style={{ margin: "0 auto 0.75rem" }} />
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "var(--text-ink)", marginBottom: "0.35rem" }}>
              All Systems Operational &amp; Healthy
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto" }}>
              {actionFilter === "all"
                ? "No bottlenecks detected. Stock levels cover expected supplier lead times, all supplier emails are dispatched, and purchase orders are on schedule."
                : `No ${actionFilter} alerts currently detected. All metrics in this category are healthy.`}
            </p>
          </div>
        )}

        {/* Action Items List */}
        {!isEmptyBusiness && filteredActions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredActions.map((action) => {
              const isCrit = action.severity === "critical";
              const isWarn = action.severity === "warning";
              const borderColor = isCrit ? "var(--accent-terracotta)" : isWarn ? "var(--accent-amber)" : "var(--brand-forest)";
              const badgeBg = isCrit ? "var(--accent-terracotta-light)" : isWarn ? "var(--accent-amber-light)" : "var(--brand-forest-light)";
              const badgeColor = isCrit ? "var(--accent-terracotta)" : isWarn ? "var(--accent-amber)" : "var(--brand-forest)";

              return (
                <div
                  key={action.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: "var(--radius-sm)",
                    padding: "1.25rem",
                    transition: "box-shadow 0.15s ease",
                    boxShadow: "var(--shadow-subtle)",
                  }}
                >
                  {/* Action Card Top Metadata */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {action.severity === "critical" ? "Critical Priority" : action.severity === "warning" ? "Warning" : "Advisory"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {action.category.replace(/_/g, " ")}
                      </span>
                    </div>

                    {action.freshnessLabel && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Clock size={12} />
                        {action.freshnessLabel}
                      </span>
                    )}
                  </div>

                  {/* Action Title */}
                  <h3
                    style={{
                      fontSize: "1.08rem",
                      fontFamily: "var(--font-serif)",
                      fontWeight: 600,
                      color: "var(--text-ink)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {action.title}
                  </h3>

                  {/* Short Explanation */}
                  <p style={{ fontSize: "0.85rem", color: "var(--text-charcoal)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                    {action.explanation}
                  </p>

                  {/* Supporting Data / Calculation Callout */}
                  {action.supportingData && (
                    <div
                      style={{
                        padding: "0.75rem 0.85rem",
                        backgroundColor: "var(--surface-subtle)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xs)",
                        marginBottom: "0.85rem",
                        fontSize: "0.78rem",
                        color: "var(--text-charcoal)",
                      }}
                    >
                      {action.supportingData.calculationText && (
                        <div style={{ marginBottom: action.supportingData.breakdown ? "0.45rem" : 0 }}>
                          <strong style={{ color: "var(--text-ink)" }}>Supporting Calculation: </strong>
                          <span>{action.supportingData.calculationText}</span>
                        </div>
                      )}
                      {action.supportingData.breakdown && action.supportingData.breakdown.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.3rem" }}>
                          {action.supportingData.breakdown.map((b, idx) => (
                            <div key={idx} style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span style={{ color: "var(--brand-forest)", fontWeight: 700 }}>&bull;</span>
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended Next Step & Direct Action Link */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      paddingTop: "0.65rem",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                      <strong style={{ color: "var(--text-ink)" }}>Recommended Next Step: </strong>
                      <span>{action.recommendedNextStep}</span>
                    </div>

                    <Link
                      href={action.actionUrl}
                      className={isCrit ? "btn-primary" : "btn-secondary"}
                      style={{
                        fontSize: "0.78rem",
                        padding: "0.35rem 0.75rem",
                        backgroundColor: isCrit ? "var(--accent-terracotta)" : undefined,
                        borderColor: isCrit ? "var(--accent-terracotta)" : undefined,
                        color: isCrit ? "#FFFFFF" : undefined,
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <span>{action.actionLabel}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* 7. LOWER SECTION: COMPACT RECENT ACTIVITY TIMELINE & CONTEXT */}
      {/* ====================================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Recent Operational Activity Timeline */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={17} color="var(--brand-forest)" />
              <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-serif)", fontWeight: 600 }}>
                Operational Activity Timeline
              </h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {timelineEvents.length} Recorded Events
            </span>
          </div>

          {timelineEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {timelineEvents.slice(0, 8).map((ev) => {
                const isExec = ev.status === "executed";
                const isAppr = ev.status === "approved";
                const isFail = ev.status === "failed";

                const pillBg = isExec
                  ? "var(--brand-forest-light)"
                  : isAppr
                  ? "var(--accent-amber-light)"
                  : isFail
                  ? "var(--accent-terracotta-light)"
                  : "var(--surface-subtle)";

                const pillColor = isExec
                  ? "var(--brand-forest)"
                  : isAppr
                  ? "var(--accent-amber)"
                  : isFail
                  ? "var(--accent-terracotta)"
                  : "var(--text-charcoal)";

                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: "0.65rem 0.75rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.15rem" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.45rem",
                            borderRadius: "var(--radius-xs)",
                            backgroundColor: pillBg,
                            color: pillColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {ev.status}
                        </span>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-ink)" }}>
                          {ev.title}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        {ev.description}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>
                        {ev.relativeTime || formatRelativeTime(ev.timestamp)}
                      </div>
                      {ev.link && (
                        <Link
                          href={ev.link}
                          style={{ fontSize: "0.72rem", color: "var(--brand-forest)", fontWeight: 600, display: "inline-block", marginTop: "0.2rem" }}
                        >
                          View &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No operational events recorded yet. Log sales or adjustments to populate timeline.
            </div>
          )}
        </div>

        {/* Right Column: Supplier Drafts & Low-Stock Context */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Supplier Restock Drafts */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={16} color="var(--brand-forest)" />
                <h3 style={{ fontSize: "1rem", fontFamily: "var(--font-serif)", fontWeight: 600 }}>
                  Supplier Restock Drafts
                </h3>
              </div>
              <Link href="/suppliers?tab=drafts" style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600 }}>
                Review All &rarr;
              </Link>
            </div>

            {metrics?.pendingEmailDrafts && metrics.pendingEmailDrafts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {metrics.pendingEmailDrafts.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "0.65rem 0.75rem",
                      backgroundColor: "var(--surface-subtle)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ minWidth: 0, paddingRight: "0.5rem" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-ink)" }}>
                        {d.recipientName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "240px",
                        }}
                      >
                        {d.subject}
                      </div>
                    </div>
                    <Link
                      href={`/suppliers?tab=drafts&draftId=${d.id}`}
                      className="btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem", whiteSpace: "nowrap" }}
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <CheckCircle2 size={24} color="#15803d" style={{ margin: "0 auto 0.35rem" }} />
                No restock drafts awaiting review.
              </div>
            )}
          </div>

          {/* Low-Stock Quick Overview */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={16} color="var(--accent-terracotta)" />
                <h3 style={{ fontSize: "1rem", fontFamily: "var(--font-serif)", fontWeight: 600 }}>
                  Active Low-Stock SKUs
                </h3>
              </div>
              <Link href="/inventory?lowStock=true" style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600 }}>
                Inventory &rarr;
              </Link>
            </div>

            {metrics?.lowStockProducts && metrics.lowStockProducts.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {metrics.lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "0.6rem 0.75rem",
                      backgroundColor: "var(--surface-subtle)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-xs)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-ink)" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        SKU: {p.sku} &bull; Supplier: {p.supplierName}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-terracotta)" }}>
                        {p.currentStock} {p.unitOfMeasure} left
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        Threshold: {p.reorderThreshold}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <CheckCircle2 size={24} color="#15803d" style={{ margin: "0 auto 0.35rem" }} />
                All active inventory stock levels healthy.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
