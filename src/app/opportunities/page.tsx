"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OpportunityWithMatch, UserProfile } from "@/types/opportunity";
import { DEFAULT_USER_PROFILE, SAMPLE_OPPORTUNITIES } from "@/lib/mockData";
import { evaluateOpportunityMatch } from "@/lib/matchingEngine";
import { generateApplicationChecklist } from "@/lib/checklistGenerator";
import {
  Compass,
  Bookmark,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Info,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function OpportunitiesPage() {
  const [activeTab, setActiveTab] = useState<"discover" | "saved">("discover");
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [opportunities, setOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<OpportunityWithMatch | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load profile and opportunities
  useEffect(() => {
    let activeProf: UserProfile = { ...DEFAULT_USER_PROFILE };

    async function init() {
      try {
        // Fetch authenticated user profile & operations settings
        const [profRes, settsRes] = await Promise.allSettled([
          fetch("/api/auth/profile"),
          fetch("/api/operations/settings"),
        ]);

        if (profRes.status === "fulfilled" && profRes.value.ok) {
          const profData = await profRes.value.json();
          if (profData.profile) {
            const p = profData.profile;
            activeProf = {
              ...activeProf,
              startupName: p.full_name ? `${p.full_name}'s Startup` : activeProf.startupName,
              industry: p.industry || activeProf.industry,
              country: p.country || "India",
              region: p.country === "India" || !p.country ? "Asia-Pacific" : activeProf.region,
              state: p.state || activeProf.state,
              stage: (p.startup_stage as any) || activeProf.stage,
              organizationType: (p.organization_type as any) || activeProf.organizationType,
              entityType: (p.entity_type as any) || activeProf.entityType,
              dpiitRecognized: (p.dpiit_recognized as any) || activeProf.dpiitRecognized,
            };
          }
        }

        if (settsRes.status === "fulfilled" && settsRes.value.ok) {
          const settsData = await settsRes.value.json();
          if (settsData.settings) {
            const s = settsData.settings;
            if (s.companyName) activeProf.startupName = s.companyName;
            if (s.businessCategory) activeProf.industry = s.businessCategory;
            if (s.country) activeProf.country = s.country;
            if (s.state) activeProf.state = s.state;
          }
        }
      } catch {
        // Fallback to localStorage if offline
        try {
          const savedProf = localStorage.getItem("oppora_profile");
          if (savedProf) {
            activeProf = { ...activeProf, ...JSON.parse(savedProf) };
          }
        } catch {}
      }

      setProfile(activeProf);
      runDiscovery(undefined, activeProf);
      loadSavedOpportunities(activeProf);
    }

    init();

    // Handle URL navigation parameters
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "saved" || tabParam === "discover") {
        setActiveTab(tabParam);
      }
      const oppId = params.get("opportunityId") || params.get("id");
      if (oppId) {
        setActiveTab("saved");
      }
    }
  }, []);

  const loadSavedOpportunities = async (targetProf?: UserProfile) => {
    const profToUse = targetProf || profile;
    try {
      const res = await fetch("/api/auth/saved");
      if (res.ok) {
        const data = await res.json();
        if (data.saved) {
          const mapped = data.saved.map((r: any) => ({
            ...r.opportunity_snapshot,
            match: evaluateOpportunityMatch(r.opportunity_snapshot, profToUse),
          }));
          setSavedOpportunities(mapped);
          return;
        }
      }
    } catch {}

    // Fallback to localStorage
    try {
      const localSaved = localStorage.getItem("oppora_saved_ids");
      if (localSaved) {
        const ids = JSON.parse(localSaved);
        const saved = SAMPLE_OPPORTUNITIES.filter((o) => ids.includes(o.id)).map((opp) => ({
          ...opp,
          match: evaluateOpportunityMatch(opp, profToUse),
        }));
        setSavedOpportunities(saved);
      }
    } catch {}
  };

  const runDiscovery = async (overrideQuery?: string, targetProf?: UserProfile) => {
    setLoading(true);
    setStatusMessage(null);
    const profToUse = targetProf || profile;
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profToUse,
          queryOverride: overrideQuery || searchQuery || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.opportunities) {
        setOpportunities(data.opportunities);
        if (data.isLive) {
          setStatusMessage(`Retrieved live opportunities tailored for "${profToUse.industry}" in ${profToUse.country}.`);
        } else if (data.warning) {
          setStatusMessage(data.warning);
        }
      } else {
        // Fallback to benchmarks scored against the active profile
        const benchmark = SAMPLE_OPPORTUNITIES.map((opp) => ({
          ...opp,
          isDemoData: true,
          match: evaluateOpportunityMatch(opp, profToUse),
        })).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));
        setOpportunities(benchmark);
      }
    } catch {
      const benchmark = SAMPLE_OPPORTUNITIES.map((opp) => ({
        ...opp,
        isDemoData: true,
        match: evaluateOpportunityMatch(opp, profToUse),
      })).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));
      setOpportunities(benchmark);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpportunity = async (opp: OpportunityWithMatch) => {
    // Check if already saved
    if (savedOpportunities.some((o) => o.id === opp.id)) return;

    const newSaved = [...savedOpportunities, opp];
    setSavedOpportunities(newSaved);

    // Save to server
    try {
      await fetch("/api/auth/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: opp, notes: "" }),
      });
    } catch {}

    // Save to localStorage
    try {
      const ids = newSaved.map((o) => o.id);
      localStorage.setItem("oppora_saved_ids", JSON.stringify(ids));
    } catch {}
  };

  const handleRemoveSaved = async (id: string) => {
    const updated = savedOpportunities.filter((o) => o.id !== id);
    setSavedOpportunities(updated);

    try {
      await fetch(`/api/auth/saved?opportunityId=${id}`, { method: "DELETE" });
    } catch {}

    try {
      const ids = updated.map((o) => o.id);
      localStorage.setItem("oppora_saved_ids", JSON.stringify(ids));
    } catch {}
  };

  const handleOpenDetail = (opp: OpportunityWithMatch) => {
    setSelectedOpp(opp);
    const generatedChecklist = generateApplicationChecklist(opp);
    setChecklist(generatedChecklist);
  };

  const filteredOpportunities = opportunities.filter((o) => {
    if (categoryFilter !== "All" && o.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        o.provider.toLowerCase().includes(q) ||
        o.shortDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppShell
      title="Startup Funding &amp; Growth Opportunities"
      subtitle="Discover non-dilutive grants, accelerators, incubation programs, and startup competitions"
      action={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => runDiscovery()}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
          >
            <Sparkles size={14} />
            {loading ? "Searching Live Web..." : "Run TinyFish Discovery"}
          </button>
        </div>
      }
    >
      {/* Tab Switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-medium)", marginBottom: "1.25rem", gap: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("discover")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "discover" ? 600 : 500,
            color: activeTab === "discover" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "discover" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Compass size={16} />
          Discovery Feed ({filteredOpportunities.length})
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          style={{
            padding: "0.65rem 0.2rem",
            fontSize: "0.92rem",
            fontWeight: activeTab === "saved" ? 600 : 500,
            color: activeTab === "saved" ? "var(--brand-forest)" : "var(--text-muted)",
            borderBottom: activeTab === "saved" ? "2px solid var(--brand-forest)" : "2px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Bookmark size={16} />
          Saved &amp; Checklists ({savedOpportunities.length})
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.65rem 1rem",
            backgroundColor: "var(--brand-forest-light)",
            border: "1px solid var(--brand-forest-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.82rem",
            color: "var(--brand-forest)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* DISCOVER TAB */}
      {activeTab === "discover" && (
        <div>
          {/* Active Business Profile Context Badge */}
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.6rem 0.85rem",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "#334155",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, color: "var(--brand-forest)" }}>Matching Context:</span>
              <span style={{ padding: "0.15rem 0.5rem", backgroundColor: "#EDE9FE", color: "#5B21B6", borderRadius: "var(--radius-xs)", fontWeight: 500 }}>
                {profile.industry}
              </span>
              <span style={{ padding: "0.15rem 0.5rem", backgroundColor: "#E0F2FE", color: "#0369A1", borderRadius: "var(--radius-xs)", fontWeight: 500 }}>
                {profile.country}{profile.state ? ` (${profile.state})` : ""}
              </span>
              <span style={{ padding: "0.15rem 0.5rem", backgroundColor: "#FEF3C7", color: "#92400E", borderRadius: "var(--radius-xs)", fontWeight: 500 }}>
                Stage: {profile.stage}
              </span>
            </div>
            <Link href="/settings" style={{ fontSize: "0.75rem", color: "var(--brand-forest)", textDecoration: "underline", fontWeight: 500 }}>
              Edit Profile in Settings &rarr;
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 280px", display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      runDiscovery(searchQuery.trim());
                    }
                  }}
                  placeholder="Search programs by grant name, provider, or industry keyword..."
                  style={{ width: "100%", padding: "0.45rem 0.75rem 0.45rem 2.2rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", fontSize: "0.85rem" }}
                />
              </div>
              {searchQuery.trim() && (
                <button
                  onClick={() => runDiscovery(searchQuery.trim())}
                  disabled={loading}
                  className="btn-primary"
                  style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem", whiteSpace: "nowrap" }}
                >
                  Search
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "0.4rem 0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", fontSize: "0.82rem", backgroundColor: "#FFFFFF" }}
              >
                <option value="All">All Categories</option>
                <option value="Grant">Grant</option>
                <option value="Accelerator">Accelerator</option>
                <option value="Incubator">Incubator</option>
                <option value="Competition">Competition</option>
                <option value="Fellowship">Fellowship</option>
              </select>
            </div>
          </div>

          {/* Opportunities Cards Grid */}
          {loading ? (
            <div style={{ backgroundColor: "#FFFFFF", padding: "3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--text-muted)" }}>
              <Sparkles size={32} color="var(--brand-forest)" style={{ margin: "0 auto 0.5rem" }} />
              <p style={{ fontWeight: 600 }}>Searching live opportunities with TinyFish Web Intelligence...</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", padding: "3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--text-muted)" }}>
              <Compass size={32} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
              <p style={{ fontWeight: 600 }}>No opportunities matched your query</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Try a broader search term or run a fresh TinyFish discovery.</p>
            </div>
          ) : (
            <div className="three-card-grid">
              {filteredOpportunities.map((opp) => {
                const isSaved = savedOpportunities.some((s) => s.id === opp.id);
                return (
                  <div
                    key={opp.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--shadow-subtle)",
                      position: "relative",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <span className="badge badge-forest">{opp.category}</span>
                        {opp.match && (
                          <span
                            className={`badge ${
                              opp.match.fitTier === "High Fit"
                                ? "badge-forest"
                                : opp.match.fitTier === "Moderate Fit"
                                ? "badge-amber"
                                : "badge-muted"
                            }`}
                          >
                            {opp.match.fitTier} ({opp.match.matchScore}%)
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: "1.08rem", fontWeight: 600, color: "var(--text-ink)", lineHeight: 1.3, marginBottom: "0.25rem" }}>
                        {opp.name}
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                        Provider: {opp.provider} &bull; {opp.geographicAvailability}
                      </div>

                      <p style={{ fontSize: "0.82rem", color: "var(--text-charcoal)", lineHeight: 1.5, marginBottom: "0.85rem" }}>
                        {opp.shortDescription}
                      </p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Award / Support:</span>
                        <strong style={{ color: "var(--brand-forest)" }}>{opp.fundingAmountOrBenefits}</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.85rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Deadline:</span>
                        <span style={{ color: opp.isExpired ? "var(--accent-rose)" : "var(--text-ink)", fontWeight: 500 }}>
                          {opp.deadlineLabel}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleOpenDetail(opp)}
                          className="btn-secondary"
                          style={{ flex: 1, fontSize: "0.78rem", padding: "0.4rem 0.5rem" }}
                        >
                          View Checklist
                        </button>
                        <button
                          onClick={() => handleSaveOpportunity(opp)}
                          disabled={isSaved}
                          className={isSaved ? "btn-secondary" : "btn-primary"}
                          style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === "saved" && (
        <div>
          {savedOpportunities.length === 0 ? (
            <div style={{ backgroundColor: "#FFFFFF", padding: "3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--text-muted)" }}>
              <Bookmark size={36} style={{ margin: "0 auto 0.5rem", color: "var(--text-faint)" }} />
              <p style={{ fontWeight: 600 }}>No saved opportunities</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Bookmark grants and programs in the Discovery feed to track deadlines and application readiness.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {savedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "var(--shadow-subtle)",
                  }}
                >
                  <div style={{ maxWidth: "70%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span className="badge badge-forest">{opp.category}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Deadline: {opp.deadlineLabel}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-ink)" }}>{opp.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Provider: {opp.provider} &bull; Funding: {opp.fundingAmountOrBenefits}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleOpenDetail(opp)}
                      className="btn-secondary"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
                    >
                      Application Checklist
                    </button>
                    {opp.sourceUrl && (
                      <a
                        href={opp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ fontSize: "0.8rem", padding: "0.4rem 0.65rem" }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => handleRemoveSaved(opp.id)}
                      style={{ color: "var(--accent-rose)", padding: "0.4rem" }}
                      title="Remove bookmark"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL & APPLICATION CHECKLIST MODAL */}
      {selectedOpp && (
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
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "var(--shadow-drawer)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <span className="badge badge-forest">{selectedOpp.category}</span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 600, marginTop: "0.35rem" }}>
                  {selectedOpp.name}
                </h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Provider: {selectedOpp.provider} &bull; Deadline: {selectedOpp.deadlineLabel}
                </div>
              </div>
              <button onClick={() => setSelectedOpp(null)} style={{ color: "var(--text-muted)" }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-charcoal)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              {selectedOpp.shortDescription}
            </p>

            {/* Checklist items */}
            <h3 style={{ fontSize: "1.05rem", fontFamily: "var(--font-serif)", fontWeight: 600, marginBottom: "0.65rem" }}>
              Application Readiness Checklist
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--text-ink)" }}>{item.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Category: {item.category} &bull; Priority: {item.priority}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
              {selectedOpp.sourceUrl ? (
                <a
                  href={selectedOpp.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
                >
                  Open Official Application Portal <ExternalLink size={13} />
                </a>
              ) : (
                <div />
              )}
              <button onClick={() => setSelectedOpp(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
