"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

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
              gap: "1.5rem",
            }}
            className="desktop-nav"
          >
            <Link
              href="/discover"
              style={{
                fontSize: "0.88rem",
                fontWeight: isActive("/discover") ? 600 : 500,
                color: isActive("/discover") ? "var(--brand-forest)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/discover") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              <Compass size={15} />
              Discover
            </Link>

            <Link
              href="/workspace"
              style={{
                fontSize: "0.88rem",
                fontWeight: isActive("/workspace") ? 600 : 500,
                color: isActive("/workspace") ? "var(--brand-forest)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.2rem",
                borderBottom: isActive("/workspace") ? "2px solid var(--brand-forest)" : "2px solid transparent",
              }}
            >
              <Bookmark size={15} />
              My Workspace
            </Link>

            <Link
              href="/#how-it-works"
              style={{
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "var(--text-muted)",
                padding: "0.35rem 0.2rem",
              }}
            >
              How It Works
            </Link>

            <Link
              href="/about"
              style={{
                fontSize: "0.88rem",
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
            href="/discover"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Compass size={16} color="var(--brand-forest)" />
            Explore Opportunities
          </Link>

          <Link
            href="/workspace"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--text-ink)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Bookmark size={16} color="var(--brand-forest)" />
            My Workspace
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
          </div>
        </div>
      )}
    </header>
  );
}
