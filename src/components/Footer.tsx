import React from "react";
import Link from "next/link";
import { Compass, Bookmark, ShieldCheck, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--surface-parchment-deep)",
        borderTop: "1px solid var(--border-medium)",
        padding: "4rem 0 2.5rem 0",
        marginTop: "auto",
      }}
    >
      <div className="container-wide">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3.5rem",
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: "340px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                textDecoration: "none",
                marginBottom: "0.85rem",
              }}
            >
              <img
                src="/oppora-logo.jpg"
                alt="Oppora Logo"
                width={28}
                height={28}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  objectFit: "cover",
                  border: "1px solid var(--border-medium)",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  color: "var(--text-ink)",
                  letterSpacing: "-0.02em",
                }}
              >
                Oppora
              </span>
            </Link>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "1rem",
              }}
            >
              Better Opportunities. Smarter Moves. A grounded startup opportunity intelligence platform for grants, accelerators, competitions, and fellowships.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.78rem",
                color: "var(--brand-forest)",
                fontWeight: 600,
                backgroundColor: "var(--brand-forest-light)",
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--brand-forest-border)",
              }}
            >
              <ShieldCheck size={13} />
              AZINHACK ’26 Submission
            </div>
          </div>

          {/* Product Navigation */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-ink)",
                marginBottom: "1rem",
                fontFamily: "var(--font-sans)",
              }}
            >
              Platform
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li>
                <Link
                  href="/discover"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  Explore Opportunities
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  Startup Onboarding
                </Link>
              </li>
              <li>
                <Link
                  href="/workspace"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  My Workspace & Checklists
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Architecture */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-ink)",
                marginBottom: "1rem",
                fontFamily: "var(--font-sans)",
              }}
            >
              Architecture & Trust
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li>
                <Link
                  href="/about"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  About Methodology
                </Link>
              </li>
              <li>
                <a
                  href="https://tinyfish.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  TinyFish Web Discovery <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/SoumilS18/Oppora"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  GitHub Repository <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-ink)",
                marginBottom: "1rem",
                fontFamily: "var(--font-sans)",
              }}
            >
              Governance & Policies
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li>
                <Link
                  href="/terms"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>
                  Support Contact: [team@oppora.dev — Configuration Placeholder]
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            <strong>Editorial Disclaimer:</strong> Oppora provides automated web discovery and deterministic heuristic eligibility estimates (0–100%) based on publicly indexed program disclosures. Match scores are relevance fit indicators, not statistical acceptance probabilities or legal endorsements. Always independently verify eligibility rules, citizenship constraints, and deadlines directly on the provider’s official website prior to submitting applications.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.8rem",
              color: "var(--text-faint)",
            }}
          >
            <span>&copy; {new Date().getFullYear()} Oppora. Built for AZINHACK ’26.</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
