"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OpportunityWithMatch, UserProfile } from "@/types/opportunity";
import { DEFAULT_USER_PROFILE, SAMPLE_OPPORTUNITIES } from "@/lib/mockData";
import { evaluateOpportunityMatch } from "@/lib/matchingEngine";
import { generateApplicationChecklist } from "@/lib/checklistGenerator";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
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
  LogOut,
  RefreshCw,
  Database,
} from "lucide-react";

interface SavedOpportunityRecord {
  id: string;
  opportunity_id: string;
  opportunity_snapshot: any;
  user_notes?: string;
  created_at: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [savedOpportunities, setSavedOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [checklistProgressMap, setChecklistProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [guestMergeCount, setGuestMergeCount] = useState<number>(0);
  const [isMerging, setIsMerging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { isConfigured } = getSupabaseConfig();

  // Load account data and reconcile with guest localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceData() {
      setIsLoading(true);

      if (!isConfigured) {
        // Fallback to local storage if Supabase is not configured yet
        try {
          const savedProf = localStorage.getItem("oppora_profile");
          if (savedProf) setProfile(JSON.parse(savedProf));

          const saved = localStorage.getItem("oppora_saved_ids");
          if (saved) {
            const ids: string[] = JSON.parse(saved);
            const opps = SAMPLE_OPPORTUNITIES.filter((o) => ids.includes(o.id)).map((opp) => ({
              ...opp,
              match: evaluateOpportunityMatch(opp, savedProf ? JSON.parse(savedProf) : DEFAULT_USER_PROFILE),
            }));
            if (isMounted) setSavedOpportunities(opps);

            // Compute local checklist progress
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
              }
            });
            if (isMounted) setChecklistProgressMap(progressObj);
          }
        } catch {}

        if (isMounted) setIsLoading(false);
        return;
      }

      // Check authentic session
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);

        // Fetch user profile from DB
        try {
          const profRes = await fetch("/api/auth/profile");
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.profile) {
              const p = profData.profile;
              const convertedProfile: UserProfile = {
                startupName: p.full_name || "My Venture",
                country: p.country || "India",
                region: "Asia-Pacific",
                state: p.state || "",
                industry: p.industry || "HealthTech & AI",
                stage: p.startup_stage || "Prototype",
                organizationType: p.organization_type || "Incorporated Startup",
                entityType: p.entity_type || "Private Limited (Pvt Ltd)",
                dpiitRecognized: p.dpiit_recognized || "In Progress / Not Sure",
                fundingNeed: p.funding_needs || "",
                focusKeywords: p.keywords || [],
                description: p.startup_description || "",
              };
              if (isMounted) setProfile(convertedProfile);
            }
          }
        } catch {}

        // Fetch saved opportunities from PostgreSQL API
        let currentDbOppIds: string[] = [];
        try {
          const savedRes = await fetch("/api/auth/saved");
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            const dbRecords: SavedOpportunityRecord[] = savedData.saved || [];
            currentDbOppIds = dbRecords.map((r) => r.opportunity_id);

            const mappedOpps: OpportunityWithMatch[] = dbRecords.map((r) => ({
              ...r.opportunity_snapshot,
              id: r.opportunity_id,
              match: evaluateOpportunityMatch(r.opportunity_snapshot, profile),
            }));

            if (isMounted) setSavedOpportunities(mappedOpps);
          }
        } catch {}

        // Fetch checklist items from PostgreSQL API
        try {
          const chkRes = await fetch("/api/auth/checklist");
          if (chkRes.ok) {
            const chkData = await chkRes.json();
            const items = chkData.items || [];
            const progressObj: Record<string, number> = {};

            // Group by opportunity_id
            const grouped: Record<string, { total: number; completed: number }> = {};
            items.forEach((item: any) => {
              const oppId = item.opportunity_id;
              if (!grouped[oppId]) grouped[oppId] = { total: 0, completed: 0 };
              grouped[oppId].total++;
              if (item.is_completed) grouped[oppId].completed++;
            });

            Object.keys(grouped).forEach((oppId) => {
              const { total, completed } = grouped[oppId];
              progressObj[oppId] = total > 0 ? Math.round((completed / total) * 100) : 0;
            });

            if (isMounted) setChecklistProgressMap(progressObj);
          }
        } catch {}

        // Check if there are guest localStorage opportunities that can be merged
        try {
          const localGuestSaved = localStorage.getItem("oppora_saved_ids");
          if (localGuestSaved) {
            const guestIds: string[] = JSON.parse(localGuestSaved);
            const unmergedCount = guestIds.filter((id) => !currentDbOppIds.includes(id)).length;
            if (isMounted) setGuestMergeCount(unmergedCount);
          }
        } catch {}
      } catch (err) {
        console.error("Workspace initialization error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  // Handle merging guest data into PostgreSQL
  const handleMergeGuestData = async () => {
    setIsMerging(true);
    setStatusMessage(null);

    try {
      const localGuestSaved = localStorage.getItem("oppora_saved_ids");
      if (!localGuestSaved) {
        setGuestMergeCount(0);
        setIsMerging(false);
        return;
      }

      const guestIds: string[] = JSON.parse(localGuestSaved);
      let mergedCount = 0;

      for (const id of guestIds) {
        const foundOpp = SAMPLE_OPPORTUNITIES.find((o) => o.id === id);
        if (foundOpp) {
          const res = await fetch("/api/auth/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunity: foundOpp, notes: "Imported from guest session" }),
          });
          if (res.ok) mergedCount++;
        }
      }

      // Re-fetch saved opportunities to update list
      const savedRes = await fetch("/api/auth/saved");
      if (savedRes.ok) {
        const savedData = await savedRes.json();
        const dbRecords: SavedOpportunityRecord[] = savedData.saved || [];
        const mappedOpps: OpportunityWithMatch[] = dbRecords.map((r) => ({
          ...r.opportunity_snapshot,
          id: r.opportunity_id,
          match: evaluateOpportunityMatch(r.opportunity_snapshot, profile),
        }));
        setSavedOpportunities(mappedOpps);
      }

      // Clear local guest cache to prevent cross-account leakage
      localStorage.removeItem("oppora_saved_ids");
      setGuestMergeCount(0);
      setStatusMessage({
        type: "success",
        text: `Successfully synced ${mergedCount} guest opportunity bookmarks to your verified PostgreSQL database.`,
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Failed to merge guest opportunities into your account. Please try again.",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDismissGuestMerge = () => {
    // Clear the guest IDs without merging to prevent other users on this computer from seeing them
    localStorage.removeItem("oppora_saved_ids");
    setGuestMergeCount(0);
  };

  // Remove saved item
  const handleRemoveSaved = async (id: string) => {
    if (isConfigured && isAuthenticated) {
      try {
        const res = await fetch(`/api/auth/saved?opportunityId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to delete from database");
        }
      } catch {
        setStatusMessage({
          type: "error",
          text: "Database deletion failed. Please check network connection.",
        });
        return;
      }
    }

    // Update state
    setSavedOpportunities((prev) => prev.filter((item) => item.id !== id));

    // Also remove from local cache
    try {
      const saved = localStorage.getItem("oppora_saved_ids");
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        localStorage.setItem("oppora_saved_ids", JSON.stringify(ids.filter((item) => item !== id)));
      }
    } catch {}
  };

  // Real secure logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
        // Also call server-side logout route to clear HTTP cookies cleanly
        await fetch("/api/auth/logout", { method: "POST" });
      }
      // Clear in-memory account data
      setSavedOpportunities([]);
      setProfile(DEFAULT_USER_PROFILE);
      setIsAuthenticated(false);
      setUserEmail(null);

      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/login");
    }
  };

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
              marginBottom: "2rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="badge badge-forest">Founder Workspace</span>
                {isAuthenticated ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.74rem",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "12px",
                      backgroundColor: "var(--brand-forest-light)",
                      color: "var(--brand-forest)",
                      fontWeight: 600,
                      border: "1px solid var(--brand-forest-border)",
                    }}
                  >
                    <CheckCircle2 size={11} /> Authenticated: {userEmail}
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.74rem",
                      padding: "0.15rem 0.55rem",
                      borderRadius: "12px",
                      backgroundColor: "var(--surface-subtle)",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    Local Guest Pipeline
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: "2.3rem", color: "var(--text-ink)", letterSpacing: "-0.02em" }}>
                My Application Pipeline
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Monitor saved opportunities, application checklist progress, and submission deadlines.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: "0.85rem" }}>
                <ArrowRight size={14} /> Open Operations Hub
              </Link>
              <Link href="/onboarding" className="btn-secondary" style={{ fontSize: "0.85rem" }}>
                <Edit3 size={14} /> Edit Profile
              </Link>
              <Link href="/discover" className="btn-secondary" style={{ fontSize: "0.85rem" }}>
                <Compass size={14} /> Discover Programs
              </Link>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--accent-rose)",
                    borderColor: "var(--accent-rose-border)",
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Oppora 2.0 Operations Hub Banner */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--brand-forest-border)",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.25rem",
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.2rem" }}>
                <span className="badge badge-forest">OPPORA 2.0 COPILOT</span>
                <strong style={{ fontSize: "0.95rem", color: "var(--brand-forest)" }}>
                  Multi-Module Startup Operations Platform
                </strong>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                Manage daily inventory, record sales transactions, track low-stock thresholds, and automate supplier emails.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}>
                Overview Dashboard
              </Link>
              <Link href="/inventory" className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}>
                Inventory
              </Link>
              <Link href="/sales" className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}>
                Sales
              </Link>
              <Link href="/suppliers" className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}>
                Suppliers
              </Link>
              <Link href="/assistant" className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}>
                AI Assistant
              </Link>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              style={{
                backgroundColor:
                  statusMessage.type === "success" ? "var(--brand-forest-light)" : "var(--accent-rose-light)",
                border: `1px solid ${
                  statusMessage.type === "success" ? "var(--brand-forest-border)" : "var(--accent-rose-border)"
                }`,
                color: statusMessage.type === "success" ? "var(--brand-forest)" : "var(--accent-rose)",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Guest Data Reconciliation Banner */}
          {isAuthenticated && guestMergeCount > 0 && (
            <div
              style={{
                backgroundColor: "var(--accent-ochre-light, #FFF8E7)",
                border: "1px solid var(--accent-ochre-border, #E6D2A8)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <RefreshCw size={20} color="var(--brand-terracotta, #AD482B)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-ink)", fontWeight: 600 }}>
                    Reconcile Prior Session Data
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-charcoal)" }}>
                    Found <strong>{guestMergeCount}</strong> opportunity bookmark(s) saved on this browser prior to signing in. Sync them into your persistent PostgreSQL database?
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleMergeGuestData}
                  disabled={isMerging}
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 0.9rem" }}
                >
                  {isMerging ? "Syncing..." : "Sync to Account"}
                </button>
                <button
                  type="button"
                  onClick={handleDismissGuestMerge}
                  disabled={isMerging}
                  className="btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 0.9rem" }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
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
              {isAuthenticated ? (
                <>
                  <Database size={14} color="var(--brand-forest)" />
                  PostgreSQL Persistent &bull; {savedOpportunities.length} saved opportunities
                </>
              ) : (
                <>
                  <Info size={14} color="var(--brand-forest)" />
                  Browser-local pipeline &bull; {savedOpportunities.length} saved opportunities
                </>
              )}
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
          {isLoading ? (
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "3rem 2rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem auto", display: "block" }} />
              Loading verified application pipeline...
            </div>
          ) : savedOpportunities.length === 0 ? (
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.3rem", color: "var(--text-ink)", margin: 0 }}>
                  Saved Opportunities ({savedOpportunities.length})
                </h3>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {isAuthenticated ? "Synced with Supabase PostgreSQL" : "Saved in Browser Storage"}
                </span>
              </div>

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
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <span className="badge badge-forest">{opp.category}</span>
                            <span className="badge badge-muted">Fit: {score}%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSaved(opp.id)}
                            aria-label="Remove from workspace"
                            style={{
                              color: "var(--text-faint)",
                              padding: "0.2rem",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Title & Provider */}
                        <h4 style={{ fontSize: "1.15rem", color: "var(--text-ink)", marginBottom: "0.3rem", lineHeight: 1.35 }}>
                          {opp.name}
                        </h4>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                          {opp.provider} &bull; {opp.geographicAvailability || "India"}
                        </p>

                        {/* Financials & Deadline */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.75rem",
                            backgroundColor: "var(--surface-subtle)",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-xs)",
                            marginBottom: "1.25rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--text-faint)", display: "block" }}>Funding/Grant</span>
                            <strong style={{ color: "var(--text-ink)" }}>
                              {opp.fundingAmountOrBenefits || "Non-dilutive grant"}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-faint)", display: "block" }}>Deadline</span>
                            <strong style={{ color: "var(--text-ink)" }}>
                              {opp.deadlineLabel || "Rolling Evaluation"}
                            </strong>
                          </div>
                        </div>

                        {/* Application Checklist Progress Bar */}
                        <div style={{ marginBottom: "1.25rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.78rem",
                              marginBottom: "0.35rem",
                            }}
                          >
                            <span style={{ color: "var(--text-charcoal)", fontWeight: 600 }}>Checklist Readiness</span>
                            <span style={{ color: "var(--brand-forest)", fontWeight: 700 }}>{progress}%</span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              backgroundColor: "var(--border-subtle)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: "100%",
                                backgroundColor: progress === 100 ? "var(--brand-forest)" : "var(--brand-terracotta)",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "1rem",
                          borderTop: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Link
                          href={`/discover?selected=${opp.id}`}
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--brand-forest)",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          Open Checklist Drawer
                          <ArrowRight size={13} />
                        </Link>

                        {opp.sourceUrl && (
                          <a
                            href={opp.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            Official Portal
                            <ExternalLink size={12} />
                          </a>
                        )}
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
