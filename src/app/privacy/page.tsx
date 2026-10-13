import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Oppora",
  description: "Privacy policy detailing data collection, processing, and local storage practices on Oppora.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3.5rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-narrow">
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginBottom: "1.5rem",
            }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div style={{ marginBottom: "2.5rem" }}>
            <span className="badge badge-muted" style={{ marginBottom: "0.5rem" }}>
              Data Governance
            </span>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
              Privacy Policy
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
              Effective Date: October 13, 2026 &bull; Last Updated: October 13, 2026
            </p>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "2.5rem 2rem",
              boxShadow: "var(--shadow-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "var(--text-charcoal)",
            }}
          >
            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                1. Overview & Privacy Principles
              </h2>
              <p>
                Oppora values founder privacy. Unlike marketing aggregators that sell founder contact lists or share confidential business decks, Oppora minimizes data collection and processes user queries through transient, server-side execution.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                2. Information You Provide in Startup Profiles
              </h2>
              <p>
                When using Oppora, you may provide metadata about your venture:
              </p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <li>Startup or project name</li>
                <li>Industry sector (e.g., CleanTech, HealthTech, AI)</li>
                <li>Geographic location (country and region)</li>
                <li>Development stage (Idea, Prototype, MVP, Early Revenue)</li>
                <li>Entity classification (Early-Stage Team, Incorporated Startup, Student Founder)</li>
                <li>Funding need range and technical keywords</li>
                <li>Short non-confidential description of the project</li>
              </ul>
              <p style={{ marginTop: "0.75rem" }}>
                <strong>No Proprietary IP or Financial Secrets:</strong> Oppora does not require or request bank credentials, cap tables, patent filings, or detailed pitch deck files.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                3. How Profile Data is Processed (TinyFish Web Integration)
              </h2>
              <p>
                When you trigger opportunity discovery, your profile parameters are used server-side to construct targeted web search queries (e.g., <code>&ldquo;CleanTech startup grants Germany 2026&rdquo;</code>). This query is sent via encrypted HTTPS to the TinyFish Search API.
              </p>
              <p style={{ marginTop: "0.75rem" }}>
                Candidate web pages returned by TinyFish are then scraped and converted into Markdown via the TinyFish Fetch API. Oppora evaluates program texts against your profile using deterministic logic. Your full profile is not permanently stored or indexed by TinyFish.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                4. Data Storage and Local Persistence (localStorage)
              </h2>
              <p>
                To provide a private, frictionless experience without mandatory cloud tracking:
              </p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <li><strong>Startup Profile:</strong> Saved in your browser&apos;s <code>localStorage</code> under <code>oppora_profile</code>.</li>
                <li><strong>Bookmarked Opportunities:</strong> Saved in your browser&apos;s <code>localStorage</code> under <code>oppora_saved_ids</code>.</li>
                <li><strong>Checklist Progress:</strong> Completed checklist items are saved in your browser&apos;s <code>localStorage</code> under <code>oppora_chk_[id]</code>.</li>
              </ul>
              <p style={{ marginTop: "0.75rem" }}>
                This data resides entirely on your device. Clearing your browser cache or site data will remove this stored information. It does not automatically synchronize across devices.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                5. Cookies & Analytics
              </h2>
              <p>
                Oppora does NOT use invasive third-party cross-site advertising cookies, tracking pixels, or data-broker SDKs. We do not sell, rent, or monetize your startup profile data.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                6. Security Safeguards
              </h2>
              <p>
                We implement industry-standard security safeguards on our Next.js backend, including:
              </p>
              <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <li>Server-Side Request Forgery (SSRF) filters blocking loopback, private networks, and cloud metadata IPs.</li>
                <li>Sliding-window rate limiting to prevent denial-of-service abuse.</li>
                <li>Payload size restrictions (maximum 50KB JSON request bodies).</li>
                <li>Strict Zod schema parsing and input sanitization to neutralize injection attacks.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.35rem", color: "var(--text-ink)", marginBottom: "0.6rem" }}>
                7. Privacy Requests & Contact Placeholder
              </h2>
              <p>
                If you have questions regarding data handling or wish to inquire about privacy practices, please contact:
              </p>
              <p style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                [Privacy Officer / Team: privacy@oppora.dev — Configuration Placeholder]
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
