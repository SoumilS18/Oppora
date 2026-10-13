"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OpportunityWithMatch, UserProfile, ChecklistItem } from "@/types/opportunity";
import { DEFAULT_USER_PROFILE, SAMPLE_OPPORTUNITIES } from "@/lib/mockData";
import { evaluateOpportunityMatch } from "@/lib/matchingEngine";
import { generateApplicationChecklist } from "@/lib/checklistGenerator";
import {
  Bookmark,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Compass,
  Edit3,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function WorkspacePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [checklistProgressMap, setChecklistProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const savedProf = localStorage.getItem("oppora_profile");
      if (savedProf) setProfile(JSON.parse(savedProf));

      const saved = localStorage.getItem("oppora_saved_ids");
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setSavedIds(ids);

        // Compute checklist progress for saved items dynamically
        const progressObj: Record<string, number> = {};
        ids.forEach((id) => {
          const completed = localStorage.getItem(`oppora_chk_${id}`);
          const targetOpp = SAMPLE_OPPORTUNITIES.find((o) => o.id === id);
          const totalItems = targetOpp ? generateApplicationChecklist(targetOpp).length : 6;
          if (completed) {
            try {
              const compIds = JSON.parse(completed);
              progressObj[id] = totalItems > 0 ? Math.min(100, Math.round((compIds.length / totalItems) * 100)) : 0;
            } catch {
              progressObj[id] = 0;
            }
          } else {
            progressObj[id] = 0;
          }
        });
        setChecklistProgressMap(progressObj);
      }
    } catch {}
  }, []);

  // Remove saved item
  const handleRemoveSaved = (id: string) => {
    const updated = savedIds.filter((item) => item !== id);
    setSavedIds(updated);
    try {
      localStorage.setItem("oppora_saved_ids", JSON.stringify(updated));
    } catch {}
  };

  // Find saved opportunities from benchmark or mock data
  const savedOpportunities = SAMPLE_OPPORTUNITIES.filter((o) => savedIds.includes(o.id)).map((opp) => ({
    ...opp,
    match: evaluateOpportunityMatch(opp, profile),
  }));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--surface-parchment)" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3rem 0 5rem 0" }}>
        <div className="container-wide">
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginBottom: "2.5rem",
            }}
          >
            <div>
              <div className="badge badge-forest" style={{ marginBottom: "0.5rem" }}>
                Founder Workspace
              </div>
              <h1 style={{ fontSize: "2.3rem", color: "var(--text-ink)", letterSpacing: "-0.02em" }}>
                My Application Pipeline
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Monitor saved opportunities, application checklist progress, and submission deadlines.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link href="/onboarding" className="btn-secondary" style={{ fontSize: "0.85rem" }}>
                <Edit3 size={14} /> Edit Profile
              </Link>
              <Link href="/discover" className="btn-primary" style={{ fontSize: "0.85rem" }}>
                <Compass size={14} /> Discover More Programs
              </Link>
            </div>
          </div>

          {/* Profile Snapshot Capsule */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)" }}>
                Active Venture Profile
              </span>
              <h3 style={{ fontSize: "1.2rem", color: "var(--text-ink)", margin: "2px 0" }}>
                {profile.startupName} &bull; {profile.industry}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Domicile: {profile.country} {profile.state ? `(${profile.state})` : ""} &bull; Stage: {profile.stage} &bull; Structure: {profile.entityType || profile.organizationType}
                {profile.dpiitRecognized && ` &bull; DPIIT: ${profile.dpiitRecognized}`}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--surface-subtle)",
                padding: "0.6rem 0.9rem",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Info size={14} color="var(--brand-forest)" />
              Browser-local pipeline &bull; {savedIds.length} saved opportunities
            </div>
          </div>

          {/* Submission Integrity Notice */}
          <div
            style={{
              backgroundColor: "var(--brand-forest-light)",
              border: "1px solid var(--brand-forest-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              fontSize: "0.8rem",
              color: "var(--brand-forest)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "2rem",
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>
              <strong>Application Governance:</strong> Oppora organizes readiness checklists and verifies eligibility criteria. We do not submit applications or contact program officials on your behalf; all submissions must be filed directly on official government or provider portals.
            </span>
          </div>

          {/* SAVED OPPORTUNITIES & CHECKLISTS SECTION */}
          {savedOpportunities.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "4rem 2rem",
                textAlign: "center",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <Bookmark size={36} color="var(--text-faint)" style={{ margin: "0 auto 1rem auto" }} />
              <h2 style={{ fontSize: "1.4rem", color: "var(--text-ink)", marginBottom: "0.5rem" }}>
                No Saved Opportunities Yet
              </h2>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.92rem",
                  maxWidth: "480px",
                  margin: "0 auto 1.75rem auto",
                  lineHeight: 1.6,
                }}
              >
                Bookmark grants and accelerator programs on the discovery page to track deadlines and generate step-by-step application readiness checklists.
              </p>
              <Link href="/discover" className="btn-primary" style={{ display: "inline-flex" }}>
                <Compass size={15} /> Explore Opportunities
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", color: "var(--text-ink)" }}>
                Saved Opportunities ({savedOpportunities.length})
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {savedOpportunities.map((opp) => {
                  const progress = checklistProgressMap[opp.id] || 0;
                  const score = opp.match?.matchScore ?? 50;

                  return (
                    <div
                      key={opp.id}
                      style={{
                        backgroundColor: "var(--surface-card)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: "var(--shadow-subtle)",
                      }}
                    >
                      <div>
                        {/* Top Category & Remove */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <span className="badge badge-forest">{opp.category}</span>
                            <span className="badge badge-muted">Fit: {score}%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSaved(opp.id)}
                            aria-label="Remove from workspace"
                            style={{ color: "var(--text-faint)", padding: "0.2rem" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Title & Provider */}
                        <h4 style={{ fontSize: "1.2rem", color: "var(--text-ink)", marginBottom: "0.25rem", lineHeight: 1.3 }}>
                          {opp.name}
                        </h4>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                          {opp.provider} &bull; {opp.geographicAvailability}
                        </p>

                        {/* Deadline & Funding info */}
                        <div
                          style={{
                            backgroundColor: "var(--surface-subtle)",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-xs)",
                            fontSize: "0.82rem",
                            marginBottom: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.3rem",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <DollarSign size={13} color="var(--brand-forest)" />
                            {opp.fundingAmountOrBenefits}
                          </div>
                          <div style={{ color: opp.isExpired ? "var(--accent-rose)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <Calendar size={13} />
                            {opp.deadlineLabel}
                          </div>
                        </div>

                        {/* Checklist Progress Bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", marginBottom: "0.35rem" }}>
                            <span style={{ fontWeight: 600, color: "var(--text-ink)" }}>Checklist Readiness</span>
                            <span style={{ color: "var(--text-muted)" }}>{progress}% Done</span>
                          </div>
                          <div style={{ width: "100%", height: "5px", backgroundColor: "var(--surface-muted)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${progress}%`,
                                height: "100%",
                                backgroundColor: "var(--brand-forest)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Verification & Conflict Flags */}
                        {opp.match?.verificationNeeded && opp.match.verificationNeeded.length > 0 && (
                          <div style={{ marginTop: "0.75rem", fontSize: "0.76rem", color: "var(--accent-amber)", display: "flex", alignItems: "flex-start", gap: "0.3rem" }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>Action needed: {opp.match.verificationNeeded[0]}</span>
                          </div>
                        )}
                        {opp.match?.disqualificationFlag && (
                          <div style={{ marginTop: "0.75rem", fontSize: "0.76rem", color: "var(--accent-rose)", display: "flex", alignItems: "flex-start", gap: "0.3rem" }}>
                            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "2px" }} />
                            <span>{opp.match.disqualificationFlag}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          marginTop: "1.25rem",
                          paddingTop: "0.85rem",
                          borderTop: "1px solid var(--border-subtle)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <a
                          href={opp.applicationUrl || opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.78rem", color: "var(--brand-forest)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          Official Portal <ExternalLink size={12} />
                        </a>

                        <Link
                          href="/discover"
                          className="btn-primary"
                          style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                        >
                          Inspect Checklist <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
