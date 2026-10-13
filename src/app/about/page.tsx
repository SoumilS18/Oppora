import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  Compass,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "About Oppora — Our Mission & Architecture",
  description: "Learn why Oppora was created, how our TinyFish web intelligence pipeline works, and our transparency principles.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3.5rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-editorial">
          {/* Header */}
          <div style={{ maxWidth: "760px", margin: "0 auto 3.5rem auto", textAlign: "center" }}>
            <img
              src="/oppora-logo.jpg"
              alt="Oppora Logo"
              width={56}
              height={56}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                objectFit: "cover",
                border: "1px solid var(--border-medium)",
                margin: "0 auto 1.25rem auto",
                display: "block",
                boxShadow: "var(--shadow-subtle)",
              }}
            />
            <span className="badge badge-forest" style={{ marginBottom: "0.6rem" }}>
              Our Mission
            </span>
            <h1 style={{ fontSize: "2.8rem", marginBottom: "0.85rem", letterSpacing: "-0.02em" }}>
              Connecting Founders with Non-Dilutive Capital
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1.6 }}>
              Oppora was built for AZINHACK ’26 to eliminate the friction, wasted hours, and disqualification traps early-stage founders face when seeking non-dilutive government funding and elite accelerators.
            </p>
          </div>

          {/* Editorial Content Cards */}
          <div
            style={{
              maxWidth: "880px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "2.5rem",
            }}
          >
            {/* The Problem We Solve */}
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "2.5rem 2rem",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", color: "var(--text-ink)" }}>
                The Problem: Fragmented Portals & Silent Disqualification
              </h2>
              <p style={{ color: "var(--text-charcoal)", lineHeight: 1.7, marginBottom: "1rem" }}>
                Every year, hundreds of crores and millions of dollars in non-dilutive government schemes (Startup India Seed Fund, BIRAC BIG, DST NIDHI-PRAYAS, MeitY TIDE 2.0, NSF SBIR, Horizon Europe), incubator infrastructure grants, and premier accelerator prizes go unawarded to qualified founders simply because discovery is fragmented across siloed ministry portals.
              </p>
              <p style={{ color: "var(--text-charcoal)", lineHeight: 1.7 }}>
                Programs are published across fragmented federal portals and institutional websites. Many require 40-page PDF downloads just to determine that a company is disqualified due to an incorporation date or geographical restriction. Founders spend weeks preparing materials only to be rejected at the eligibility desk.
              </p>
            </div>

            {/* Our Solution & TinyFish */}
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "2.5rem 2rem",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <div className="badge badge-forest" style={{ marginBottom: "0.75rem" }}>
                Web Intelligence Pipeline
              </div>
              <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", color: "var(--text-ink)" }}>
                Why TinyFish is Core to Oppora
              </h2>
              <p style={{ color: "var(--text-charcoal)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                Traditional web scrapers fail on government portals and accelerator platforms because they deploy aggressive Cloudflare anti-bot walls and render application forms inside dynamic client-side SPAs.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                <div style={{ backgroundColor: "var(--surface-subtle)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--brand-forest)" }}>
                    1. TinyFish Search API
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Discovers freshly published, open grant announcements for the current calendar cycle directly from the live web.
                  </p>
                </div>

                <div style={{ backgroundColor: "var(--surface-subtle)", padding: "1.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--brand-forest)" }}>
                    2. TinyFish Headless Fetch API
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Renders dynamic JavaScript in headless Chromium, stripping navigation boilerplate to deliver clean Markdown documentation.
                  </p>
                </div>
              </div>
            </div>

            {/* The Three Integrity Principles */}
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "2.5rem 2rem",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", color: "var(--text-ink)" }}>
                Our Three Principles of Data Integrity
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="var(--brand-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-ink)" }}>
                      1. Never Invent Program Facts or Deadlines
                    </strong>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>
                      Every grant amount, deadline, and eligibility requirement is grounded in the source page text. If a deadline or grant amount is unstated, Oppora labels it as unstated rather than hallucinating plausible numbers.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="var(--brand-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-ink)" }}>
                      2. Match Scores are Heuristics, Not Winning Odds
                    </strong>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>
                      A 95% fit score indicates strong alignment across stage, domain, and entity type. We never mislead founders into believing a score guarantees acceptance or funding.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="var(--brand-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "var(--text-ink)" }}>
                      3. Enforce Hard Disqualification Caps
                    </strong>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.2rem" }}>
                      When hard barriers exist (such as an expired deadline or geographic exclusion), the match score is capped at &le; 25% with prominent red conflict warnings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Box */}
            <div
              style={{
                backgroundColor: "var(--surface-parchment-deep)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
                Explore Oppora in Action
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
                Test our matching engine across three preset profiles or configure your own venture details.
              </p>
              <Link href="/discover" className="btn-primary">
                Launch Discovery Engine <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
