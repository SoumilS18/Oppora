import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VideoShowcase } from "@/components/VideoShowcase";
import {
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Compass,
  FileText,
  AlertTriangle,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  Lock,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section
          style={{
            padding: "4.75rem 0 3.75rem 0",
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "var(--surface-parchment)",
          }}
        >
          <div className="container-editorial">
            <div style={{ maxWidth: "840px", margin: "0 auto", textAlign: "center" }}>
              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--brand-forest)",
                  backgroundColor: "var(--brand-forest-light)",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--brand-forest-border)",
                  marginBottom: "1.5rem",
                }}
              >
                <ShieldCheck size={14} />
                AI-Powered Startup Operations Copilot &amp; Growth Platform
              </div>

              {/* Editorial Title */}
              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5.2vw, 3.8rem)",
                  fontWeight: 500,
                  color: "var(--text-ink)",
                  lineHeight: 1.14,
                  letterSpacing: "-0.025em",
                  marginBottom: "1.35rem",
                }}
              >
                Run Smarter.
                <br />
                <span style={{ fontStyle: "italic", color: "var(--brand-forest)" }}>
                  Grow Further.
                </span>
              </h1>

              {/* Subheading */}
              <p
                style={{
                  fontSize: "1.12rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.62,
                  maxWidth: "740px",
                  margin: "0 auto 2.25rem auto",
                }}
              >
                Oppora is the operational copilot for founders and growing businesses. Maintain reliable inventory and sales records, anticipate stock shortages, prepare reviewable supplier emails, and discover non-dilutive government grants and growth opportunities in one unified workspace.
              </p>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{ fontSize: "1rem", padding: "0.85rem 1.75rem" }}
                >
                  Launch Operations Hub
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/opportunities"
                  className="btn-secondary"
                  style={{ fontSize: "1rem", padding: "0.85rem 1.6rem" }}
                >
                  <Compass size={16} />
                  Explore Grants &amp; Programs
                </Link>
              </div>
            </div>

            {/* Video Showcase Centerpiece */}
            <div style={{ maxWidth: "840px", margin: "2.5rem auto 0 auto", textAlign: "left" }}>
              <VideoShowcase />
            </div>

            {/* Verified Ecosystem Coverage Indicators */}
            <div
              style={{
                marginTop: "2.75rem",
                paddingTop: "1.75rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.75rem",
                fontSize: "0.82rem",
                color: "var(--text-faint)",
                flexWrap: "wrap",
                textAlign: "center",
              }}
            >
              <span>&bull; Startup India &amp; DPIIT</span>
              <span>&bull; BIRAC Biotechnology Grants</span>
              <span>&bull; DST NIDHI &amp; MeitY Startup Hub</span>
              <span>&bull; State Innovation Missions (ELEVATE)</span>
              <span>&bull; Global Accelerators (YC, Google)</span>
            </div>
          </div>
        </section>

        {/* REALISTIC PRODUCT PREVIEW (VERIFIED INDIAN & GLOBAL BENCHMARKS) */}
        <section
          style={{
            padding: "4rem 0",
            backgroundColor: "var(--surface-parchment-deep)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="container-editorial">
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div
                className="badge badge-amber"
                style={{ marginBottom: "0.6rem" }}
              >
                Verified Ecosystem Benchmarks
              </div>
              <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                Grounded Opportunity Cards with Real Eligibility Reasoning
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.96rem", maxWidth: "660px", margin: "0 auto" }}>
                Every opportunity separates verified source facts from Oppora&apos;s heuristic fit assessment, highlighting mandatory prerequisites and strict disqualification barriers.
              </p>
            </div>

            {/* Mock Preview Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.5rem",
                maxWidth: "1060px",
                margin: "0 auto",
              }}
            >
              {/* Card 1: Startup India Seed Fund Scheme (SISFS) */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.6rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span className="badge badge-forest">High Fit (95%)</span>
                    <span className="badge badge-muted">Grant &amp; Debt</span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", color: "var(--text-ink)" }}>
                    Startup India Seed Fund Scheme (SISFS)
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    DPIIT, Ministry of Commerce &amp; Industry &bull; India
                  </p>

                  <div
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.85rem",
                      marginBottom: "1rem",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, color: "var(--text-ink)", marginBottom: "0.25rem" }}>
                      <DollarSign size={14} color="var(--brand-forest)" />
                      Up to ₹20L grant (PoC) + ₹50L debt/debentures
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      <Calendar size={13} />
                      Rolling Review (Open via approved incubators)
                    </div>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)", lineHeight: 1.55 }}>
                    <strong>Synergy Reason:</strong> Prototype-stage Indian startup aligns with DPIIT validation criteria. Disbursed via accredited incubators.
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--accent-amber)", marginTop: "0.5rem" }}>
                    &bull; Prerequisite: Startup India DPIIT recognition &amp; incorporation &lt; 2 years.
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={14} /> Official Portal Grounded
                  </span>
                  <Link
                    href="/discover"
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--brand-forest)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    Inspect <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Card 2: BIRAC Biotechnology Ignition Grant (BIG) */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.6rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span className="badge badge-forest">High Fit (92%)</span>
                    <span className="badge badge-muted">Grant-in-Aid</span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", color: "var(--text-ink)" }}>
                    BIRAC Biotechnology Ignition Grant
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Biotechnology Industry Research Assistance Council &bull; India
                  </p>

                  <div
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.85rem",
                      marginBottom: "1rem",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600, color: "var(--text-ink)", marginBottom: "0.25rem" }}>
                      <DollarSign size={14} color="var(--brand-forest)" />
                      Up to ₹50 Lakhs non-dilutive grant (18 mos)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      <Calendar size={13} />
                      Application Deadline: Nov 15, 2026 (Call 26)
                    </div>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--text-charcoal)", lineHeight: 1.55 }}>
                    <strong>Synergy Reason:</strong> Prototype MedTech/Diagnostics venture matches BIRAC mandate for commercially viable biotech proof-of-concept.
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--brand-forest)", marginTop: "0.5rem" }}>
                    &bull; Managed through 9 partner centres (C-CAMP, Venture Center, FITT).
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={14} /> Official Portal Grounded
                  </span>
                  <Link
                    href="/discover"
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--brand-forest)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    Inspect <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Card 3: Hard Disqualification Capped (EIC Accelerator) */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--accent-rose-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.6rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span className="badge badge-rose">Disqualified (&le; 25%)</span>
                    <span className="badge badge-muted">Grant &amp; Equity</span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem", color: "var(--text-ink)" }}>
                    EIC Accelerator 2026
                  </h3>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    European Commission &bull; EU Member States
                  </p>

                  <div
                    style={{
                      backgroundColor: "var(--accent-rose-light)",
                      padding: "0.75rem 0.85rem",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.82rem",
                      marginBottom: "1rem",
                      border: "1px solid var(--accent-rose-border)",
                      color: "var(--accent-rose)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                      <AlertTriangle size={14} />
                      Geographic Ineligibility Barrier
                    </div>
                    Program strictly requires legal entity in EU or Horizon Europe. Indian-based startup disqualified.
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    <strong>Founder Protection:</strong> Score hard-capped at 25% to prevent wasting 40+ hours writing an extensive European blended finance proposal.
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--accent-rose)", fontWeight: 600 }}>
                    Hard Cap Enforced (&le; 25%)
                  </span>
                  <Link
                    href="/discover"
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--brand-forest)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    Inspect <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* MANDATORY 3 FEATURE CARDS IN EXACTLY THREE COLUMNS PER ROW */}
        <section
          style={{
            padding: "5rem 0",
            backgroundColor: "var(--surface-parchment)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="container-editorial">
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <div className="badge badge-forest" style={{ marginBottom: "0.6rem" }}>
                Core Capabilities
              </div>
              <h2 style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>
                Built for Clarity, Not Vanity Metrics
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto" }}>
                Oppora cuts through disorganized funding directories with three disciplined steps from discovery to application submission.
              </p>
            </div>

            {/* Exactly 3 Columns on Desktop */}
            <div
              className="three-card-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.75rem",
                alignItems: "stretch",
              }}
            >
              {/* Feature 1 */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "2rem 1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--brand-forest-light)",
                      border: "1px solid var(--brand-forest-border)",
                      color: "var(--brand-forest)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <Search size={20} />
                  </div>
                  <h3 style={{ fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-ink)" }}>
                    1. Discover Relevant Opportunities
                  </h3>
                  <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Directly query the live web using TinyFish Search and Headless Fetch APIs. Extract authentic government RFP notices, accelerator cohorts, and fellowships bypassing anti-bot walls without stale manual database lag.
                  </p>
                </div>
                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.82rem", color: "var(--text-charcoal)", fontWeight: 500 }}>
                  &bull; Live web extraction with primary source URLs
                </div>
              </div>

              {/* Feature 2 */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "2rem 1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent-terracotta-light)",
                      border: "1px solid var(--accent-terracotta-border)",
                      color: "var(--accent-terracotta)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <h3 style={{ fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-ink)" }}>
                    2. Understand Fit and Eligibility
                  </h3>
                  <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Deterministic matching calculates calibrated heuristic fit estimates. Hard caps isolate geographic exclusions, stage barriers, and expired deadlines so you never waste effort on closed or ineligible programs.
                  </p>
                </div>
                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.82rem", color: "var(--text-charcoal)", fontWeight: 500 }}>
                  &bull; Heuristic scores (5%&ndash;98%) with explicit reason breakdown
                </div>
              </div>

              {/* Feature 3 */}
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  padding: "2rem 1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent-amber-light)",
                      border: "1px solid var(--accent-amber-border)",
                      color: "var(--accent-amber)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <h3 style={{ fontSize: "1.35rem", marginBottom: "0.6rem", color: "var(--text-ink)" }}>
                    3. Organize Application Preparation
                  </h3>
                  <p style={{ fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Transform complex RFP guidelines into structured readiness checklists: mandatory portal requirements, manual verifications (SAM.gov cage codes, citizenship), and tailored pitch deck drafting steps.
                  </p>
                </div>
                <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.82rem", color: "var(--text-charcoal)", fontWeight: 500 }}>
                  &bull; Interactive checklists with browser-local persistence
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW OPPORA WORKS (3-STEP PIPELINE) */}
        <section
          id="how-it-works"
          style={{
            padding: "5rem 0",
            backgroundColor: "var(--surface-parchment-deep)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="container-editorial">
            <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", marginBottom: "3rem" }}>
              <div className="badge badge-muted" style={{ marginBottom: "0.6rem" }}>
                Operational Workflow
              </div>
              <h2 style={{ fontSize: "2.1rem", marginBottom: "0.6rem" }}>
                How Oppora Operates
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                A straightforward three-phase pipeline engineered to preserve data provenance at every stage.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2rem",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              <div style={{ backgroundColor: "var(--surface-card)", padding: "1.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-forest)", marginBottom: "0.5rem" }}>
                  PHASE 1
                </div>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Define Startup Profile</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Enter your industry, development stage, entity location, and funding target in a 2-step onboarding wizard. Or select a preset profile to test matching instantly.
                </p>
              </div>

              <div style={{ backgroundColor: "var(--surface-card)", padding: "1.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-terracotta)", marginBottom: "0.5rem" }}>
                  PHASE 2
                </div>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Live Web Discovery</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  TinyFish queries official funding directories and program landing pages, stripping ads and cookie notices to return verified Markdown documentation.
                </p>
              </div>

              <div style={{ backgroundColor: "var(--surface-card)", padding: "1.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-amber)", marginBottom: "0.5rem" }}>
                  PHASE 3
                </div>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Heuristic Scoring & Prep</h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Match criteria are analyzed deterministically. Inspect verified benefits, read the fit rationale, check off submission items, and save opportunities to your workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST AND TRANSPARENCY SECTION */}
        <section
          style={{
            padding: "4.5rem 0",
            backgroundColor: "var(--surface-parchment)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="container-editorial">
            <div
              style={{
                backgroundColor: "var(--brand-forest)",
                color: "#FFFFFF",
                borderRadius: "var(--radius-lg)",
                padding: "3rem 2.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2.5rem",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "var(--radius-xs)",
                    display: "inline-block",
                    marginBottom: "1rem",
                  }}
                >
                  Architectural Principle
                </span>
                <h2 style={{ color: "#FFFFFF", fontSize: "2rem", marginBottom: "0.75rem" }}>
                  Our Transparency Contract
                </h2>
                <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.96rem", lineHeight: 1.6 }}>
                  Oppora rejects the hallucinated certainty common in modern AI interfaces. We ground every discovery in traceable source links and explicitly flag when information is missing or ambiguous.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="#99E2BB" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>Primary Source Citations</strong>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                      Every discovered program retains its direct URL. We distinguish the program info page from the actual submission portal.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="#99E2BB" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>Heuristic Estimates, Not Probabilities</strong>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                      A 90% score represents structural criteria alignment, not a 90% chance of receiving a check.
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <CheckCircle2 size={18} color="#99E2BB" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>Hard Disqualification Caps</strong>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                      Geographic ineligibility and expired deadlines are hard-capped (&le; 25%), ensuring blockers are prominent.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section
          style={{
            padding: "5rem 0",
            backgroundColor: "var(--surface-parchment-deep)",
            textAlign: "center",
          }}
        >
          <div className="container-editorial">
            <h2 style={{ fontSize: "2.3rem", marginBottom: "0.85rem" }}>
              Ready to Navigate Your Funding Pipeline?
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.05rem",
                maxWidth: "560px",
                margin: "0 auto 2rem auto",
                lineHeight: 1.6,
              }}
            >
              Start in under two minutes. Define your startup profile or test the matching engine with one of our benchmark presets.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/onboarding"
                className="btn-primary"
                style={{ fontSize: "1rem", padding: "0.8rem 1.75rem" }}
              >
                Find My Opportunities
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/discover"
                className="btn-secondary"
                style={{ fontSize: "1rem", padding: "0.8rem 1.5rem" }}
              >
                Explore Benchmark Catalog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
