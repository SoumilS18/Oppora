"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Bookmark, Menu, X, ArrowRight, ShieldCheck, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) return;

    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUserEmail(session.user.email || null);
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          if (metaName) setUserName(metaName);

          // Also pull verified profile row from API
          fetch("/api/auth/profile")
            .then((res) => res.json())
            .then((data) => {
              if (data.profile?.full_name) {
                setUserName(data.profile.full_name);
              }
            })
            .catch(() => {});
        } else {
          setUserEmail(null);
          setUserName(null);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUserEmail(session.user.email || null);
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          if (metaName) setUserName(metaName);
        } else {
          setUserEmail(null);
          setUserName(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {}
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      setUserEmail(null);
      setUserName(null);
      window.location.href = "/login";
    } catch {}
  };

  return (
    <header
      style={{
        backgroundColor: "var(--surface-parchment)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        className="container-wide"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Brand Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
            }}
          >
            <img
              src="/oppora-logo.jpg"
              alt="Oppora Logo"
              width={30}
              height={30}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                objectFit: "cover",
                border: "1px solid var(--border-medium)",
                display: "block",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.45rem",
                fontWeight: 600,
                color: "var(--text-ink)",
                letterSpacing: "-0.02em",
              }}
            >
              Oppora
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: "none",
              alignItems: "center",
              gap: "1.25rem",
            }}
            className="desktop-nav"
          >
            <Link
              href="/dashboard"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/dashboard") ? 600 : 500,
                color: isActive("/dashboard") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/dashboard") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              Overview
            </Link>

            <Link
              href="/inventory"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/inventory") ? 600 : 500,
                color: isActive("/inventory") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/inventory") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              Inventory
            </Link>

            <Link
              href="/sales"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/sales") ? 600 : 500,
                color: isActive("/sales") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/sales") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              Sales
            </Link>

            <Link
              href="/suppliers"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/suppliers") ? 600 : 500,
                color: isActive("/suppliers") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/suppliers") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              Suppliers
            </Link>

            <Link
              href="/opportunities"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/opportunities") || isActive("/discover") ? 600 : 500,
                color: isActive("/opportunities") || isActive("/discover") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/opportunities") || isActive("/discover") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              Opportunities
            </Link>

            <Link
              href="/assistant"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/assistant") ? 600 : 500,
                color: isActive("/assistant") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/assistant") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              AI Copilot
            </Link>

            <Link
              href="/about"
              style={{
                fontSize: "0.86rem",
                fontWeight: isActive("/about") ? 600 : 500,
                color: isActive("/about") ? "var(--brand-forest)" : "var(--text-muted)",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/about") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              About
            </Link>
          </nav>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            className="desktop-nav"
            style={{ display: "none", alignItems: "center", gap: "0.85rem" }}
          >
            {userEmail ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link
                  href="/workspace"
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--brand-forest)",
                    backgroundColor: "var(--brand-forest-light)",
                    border: "1px solid var(--brand-forest-border)",
                    borderRadius: "var(--radius-xs)",
                    padding: "0.35rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    textDecoration: "none",
                  }}
                >
                  <User size={13} />
                  <span>{userName || (userEmail ? userEmail.split("@")[0] : "My Workspace")}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.45rem 0.6rem",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    padding: "0.45rem 0.85rem",
                  }}
                >
                  Sign In
                </Link>

                <Link
                  href="/onboarding"
                  className="btn-primary"
                  style={{
                    fontSize: "0.84rem",
                    padding: "0.5rem 1rem",
                  }}
                >
                  Find Opportunities
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="mobile-toggle"
            style={{
              padding: "0.5rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
              color: "var(--text-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "var(--surface-card)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            Overview
          </Link>

          <Link
            href="/inventory"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            Inventory Management
          </Link>

          <Link
            href="/sales"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            Sales &amp; Revenue
          </Link>

          <Link
            href="/suppliers"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            Suppliers &amp; Restock
          </Link>

          <Link
            href="/opportunities"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            Grants &amp; Opportunities
          </Link>

          <Link
            href="/assistant"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
            }}
          >
            AI Operations Copilot
          </Link>

          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-muted)",
            }}
          >
            How It Works
          </Link>

          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-muted)",
            }}
          >
            About Oppora
          </Link>

          <hr style={{ border: "none", height: "1px", backgroundColor: "var(--border-subtle)" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {userEmail ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", color: "var(--accent-rose)" }}
              >
                Sign Out {userName ? `(${userName})` : userEmail ? `(${userEmail})` : ""}
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Sign In
                </Link>

                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Find Opportunities
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
