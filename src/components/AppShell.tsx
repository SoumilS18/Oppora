"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  Compass,
  Sparkles,
  Settings,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Mail,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AppShell({ children, title, subtitle, action }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("My Business");
  const [currency, setCurrency] = useState<string>("INR");
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);

  // Fetch operational status badges
  useEffect(() => {
    let isMounted = true;

    async function fetchBadgeCounts() {
      try {
        const res = await fetch("/api/operations/overview?period=30d");
        if (res.ok) {
          const data = await res.json();
          if (data.metrics && isMounted) {
            setLowStockCount(data.metrics.lowStockProductsCount || 0);
            setPendingDraftsCount(data.metrics.pendingEmailDrafts?.length || 0);
            if (data.metrics.currency) setCurrency(data.metrics.currency);
          }
        }
      } catch {}
    }

    fetchBadgeCounts();

    // Check auth session
    const { isConfigured } = getSupabaseConfig();
    if (isConfigured) {
      try {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && isMounted) {
            setUserEmail(session.user.email || null);
            const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
            if (metaName) {
              setUserName(metaName);
              setCompanyName((prev) => (prev === "My Business" ? `${metaName}'s Business` : prev));
            }
          }
        });
      } catch {}
    }

    // Fetch settings for company name
    fetch("/api/operations/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.companyName && isMounted) {
          setCompanyName(d.settings.companyName);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard" || pathname === "/workspace",
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: Package,
      active: pathname === "/inventory",
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: "var(--accent-terracotta)",
    },
    {
      label: "Sales",
      href: "/sales",
      icon: TrendingUp,
      active: pathname === "/sales",
    },
    {
      label: "Suppliers",
      href: "/suppliers",
      icon: Truck,
      active: pathname === "/suppliers",
      badge: pendingDraftsCount > 0 ? `${pendingDraftsCount} drafts` : undefined,
      badgeColor: "var(--accent-amber)",
    },
    {
      label: "Opportunities",
      href: "/opportunities",
      icon: Compass,
      active: pathname === "/opportunities" || pathname === "/discover",
    },
    {
      label: "AI Assistant",
      href: "/assistant",
      icon: Sparkles,
      active: pathname === "/assistant",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--surface-parchment)" }}>
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        style={{
          width: "256px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
        className="desktop-nav"
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "1.25rem 1.25rem 1rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                backgroundColor: "var(--brand-forest)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.1rem",
                fontFamily: "var(--font-serif)",
              }}
            >
              O
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--text-ink)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                Oppora
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                Startup Operations Copilot
              </div>
            </div>
          </Link>

          {/* Venture Switcher / Profile Badge */}
          <div
            style={{
              marginTop: "0.9rem",
              padding: "0.45rem 0.65rem",
              backgroundColor: "var(--surface-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--text-ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {companyName}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--brand-forest)", fontWeight: 500 }}>
                Currency: {currency}
              </div>
            </div>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
              title="Operational State: Active"
            />
          </div>
        </div>

        {/* Navigation Destination Links */}
        <nav style={{ padding: "0.85rem 0.65rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  fontWeight: item.active ? 600 : 500,
                  color: item.active ? "var(--brand-forest)" : "var(--text-charcoal)",
                  backgroundColor: item.active ? "var(--brand-forest-light)" : "transparent",
                  border: item.active ? "1px solid var(--brand-forest-border)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Icon size={17} color={item.active ? "var(--brand-forest)" : "var(--text-muted)"} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "10px",
                      backgroundColor: item.badgeColor,
                      color: "#FFFFFF",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: "0.85rem 1rem",
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--surface-parchment)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--text-ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName || userEmail || "Founder Workspace"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                Run Smarter. Grow Further.
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                color: "var(--text-muted)",
                padding: "0.35rem",
                borderRadius: "var(--radius-xs)",
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Mobile Toggle & Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-toggle"
              style={{
                display: "none",
                padding: "0.4rem",
                color: "var(--text-ink)",
              }}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--text-ink)",
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Contextual Action Slot */}
          {action && <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>{action}</div>}
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderBottom: "2px solid var(--border-medium)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.92rem",
                    fontWeight: item.active ? 600 : 500,
                    color: item.active ? "var(--brand-forest)" : "var(--text-charcoal)",
                    backgroundColor: item.active ? "var(--brand-forest-light)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.45rem",
                        borderRadius: "10px",
                        backgroundColor: item.badgeColor,
                        color: "#FFFFFF",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content Body */}
        <main style={{ flex: 1, padding: "1.75rem 1.5rem 3rem" }}>
          <div className="container-wide" style={{ padding: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
