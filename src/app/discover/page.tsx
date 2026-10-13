"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  OpportunityWithMatch,
  UserProfile,
  ChecklistItem,
} from "@/types/opportunity";
import { DEFAULT_USER_PROFILE, PRESET_PROFILES, SAMPLE_OPPORTUNITIES } from "@/lib/mockData";
import { evaluateOpportunityMatch } from "@/lib/matchingEngine";
import { generateApplicationChecklist } from "@/lib/checklistGenerator";
import {
  Search,
  Sparkles,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Edit3,
  ShieldCheck,
  ArrowRight,
  Globe,
  CheckSquare,
  X,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Compass,
} from "lucide-react";

export default function DiscoverPage() {
  // Profile State
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // Discovery State
  const [opportunities, setOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customSearchTerm, setCustomSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGeography, setSelectedGeography] = useState<string>("All");
  const [selectedDpiit, setSelectedDpiit] = useState<string>("All");
  const [selectedFitTier, setSelectedFitTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score" | "deadline">("score");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  // Active Detail Modal & Checklist
  const [selectedOpp, setSelectedOpp] = useState<OpportunityWithMatch | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>([]);

  // Engine status
  const [discoveryMode, setDiscoveryMode] = useState<"live" | "demo">("demo");
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [discoveryNotice, setDiscoveryNotice] = useState<string>("");
  const [tinyFishConfigured, setTinyFishConfigured] = useState<boolean>(false);

  // 1. Initialize Profile from localStorage & initial matching
  useEffect(() => {
    let initialProf = DEFAULT_USER_PROFILE;
    try {
      const saved = localStorage.getItem("oppora_saved_ids");
      if (saved) setSavedIds(JSON.parse(saved));
      const savedProfile = localStorage.getItem("oppora_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditedProfile(parsed);
        initialProf = parsed;
      }
    } catch {
      // Local storage unavailable
    }

    // Initial benchmark matching
    const initialMatched = SAMPLE_OPPORTUNITIES.map((opp) => ({
      ...opp,
      isDemoData: true,
      match: evaluateOpportunityMatch(opp, initialProf),
    })).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));

    setOpportunities(initialMatched);
  }, []);

  // 2. Query /api/health to inspect backend configuration
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setTinyFishConfigured(Boolean(data.tinyFishConfigured));
        if (data.tinyFishConfigured) {
          setDiscoveryMode("live");
          setIsLiveActive(true);
        } else {
          setDiscoveryMode("demo");
          setIsLiveActive(false);
        }
      })
      .catch(() => {});
  }, []);

  // Switch to Preset Profile
  const handleSelectPreset = (presetProfile: UserProfile) => {
    setProfile(presetProfile);
    setEditedProfile(presetProfile);
    try {
      localStorage.setItem("oppora_profile", JSON.stringify(presetProfile));
    } catch {}

    // Recompute matches across currently loaded opportunities
    setOpportunities((prev) =>
      prev
        .map((opp) => ({
          ...opp,
          match: evaluateOpportunityMatch(opp, presetProfile),
        }))
        .sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0))
    );
  };

  // Trigger Discovery Pipeline
  const runDiscovery = async (forceDemoMode: boolean = false) => {
    setIsLoading(true);
    setDiscoveryNotice("");

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          queryOverride: customSearchTerm.trim() || undefined,
          forceDemo: forceDemoMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      if (data.opportunities && Array.isArray(data.opportunities)) {
        setOpportunities(data.opportunities);
        setIsLiveActive(Boolean(data.isLive));
        setDiscoveryMode(data.mode === "live" ? "live" : "demo");

        if (data.warning) {
          setDiscoveryNotice(data.warning);
        } else if (data.message) {
          setDiscoveryNotice(data.message);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Discovery request failed";
      setDiscoveryNotice(`Notice: ${errMsg}. Displaying verified benchmark catalog.`);
      // Local benchmark fallback
      const fallback = SAMPLE_OPPORTUNITIES.map((opp) => ({
        ...opp,
        isDemoData: true,
        match: evaluateOpportunityMatch(opp, profile),
      })).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));
      setOpportunities(fallback);
      setIsLiveActive(false);
      setDiscoveryMode("demo");
    } finally {
      setIsLoading(false);
    }
  };

  // Bookmark toggle
  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("oppora_saved_ids", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Open Detailed Drawer
  const openOpportunityDetails = (opp: OpportunityWithMatch) => {
    setSelectedOpp(opp);
    const generated = generateApplicationChecklist(opp);
    setChecklist(generated);

    try {
      const savedCompleted = localStorage.getItem(`oppora_chk_${opp.id}`);
      if (savedCompleted) {
        setCompletedChecklistIds(JSON.parse(savedCompleted));
      } else {
        setCompletedChecklistIds([]);
      }
    } catch {
      setCompletedChecklistIds([]);
    }
  };

  // Toggle individual checklist item
  const toggleChecklistItem = (itemId: string) => {
    if (!selectedOpp) return;
    setCompletedChecklistIds((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      try {
        localStorage.setItem(`oppora_chk_${selectedOpp.id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMarkAllChecklist = () => {
    if (!selectedOpp) return;
    const allIds = checklist.map((c) => c.id);
    setCompletedChecklistIds(allIds);
    try {
      localStorage.setItem(`oppora_chk_${selectedOpp.id}`, JSON.stringify(allIds));
    } catch {}
  };

  const handleResetChecklist = () => {
    if (!selectedOpp) return;
    setCompletedChecklistIds([]);
    try {
      localStorage.removeItem(`oppora_chk_${selectedOpp.id}`);
    } catch {}
  };

  // Save updated profile
  const handleSaveProfile = () => {
    setProfile(editedProfile);
    try {
      localStorage.setItem("oppora_profile", JSON.stringify(editedProfile));
    } catch {}
    setIsEditingProfile(false);

    setOpportunities((prev) =>
      prev
        .map((opp) => ({
          ...opp,
          match: evaluateOpportunityMatch(opp, editedProfile),
        }))
        .sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0))
    );
  };

  // Filtered & Sorted Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        if (showSavedOnly && !savedIds.includes(opp.id)) return false;
        if (selectedCategory !== "All" && opp.category !== selectedCategory) return false;
        if (selectedFitTier !== "All" && opp.match?.fitTier !== selectedFitTier) return false;

        // Geography Filter
        if (selectedGeography !== "All") {
          const geoLower = opp.geographicAvailability.toLowerCase();
          if (selectedGeography === "India") {
            if (!geoLower.includes("india")) return false;
          } else if (selectedGeography === "State-Specific") {
            if (opp.geographicScope !== "State-Specific" && (!opp.eligibleStates || opp.eligibleStates.length === 0)) {
              return false;
            }
          } else if (selectedGeography === "Global") {
            if (!geoLower.includes("global") && !geoLower.includes("remote") && !geoLower.includes("worldwide")) {
              return false;
            }
          }
        }

        // DPIIT Requirement Filter
        if (selectedDpiit !== "All") {
          if (selectedDpiit === "DPIIT Required" && !opp.dpiitRequired) return false;
          if (selectedDpiit === "No DPIIT Needed" && opp.dpiitRequired) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = opp.name.toLowerCase().includes(q);
          const matchProvider = opp.provider.toLowerCase().includes(q);
          const matchDesc = opp.shortDescription.toLowerCase().includes(q);
          if (!matchName && !matchProvider && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          return (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0);
        }
        if (sortBy === "deadline") {
          if (!a.applicationDeadline) return 1;
          if (!b.applicationDeadline) return -1;
          return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
        }
        return 0;
      });
  }, [
    opportunities,
    showSavedOnly,
    savedIds,
    selectedCategory,
    selectedFitTier,
    selectedGeography,
    selectedDpiit,
    searchQuery,
    sortBy,
  ]);

  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    return Math.round((completedChecklistIds.length / checklist.length) * 100);
  }, [checklist, completedChecklistIds]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--surface-parchment)" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "2rem 0 5rem 0" }}>
        <div className="container-wide">
          {/* TOP PROFILE & BENCHMARK PRESET BAR */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              {/* Profile Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--brand-forest-light)",
                    border: "1px solid var(--brand-forest-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--brand-forest)",
                    fontWeight: 700,
                  }}
                >
                  {profile.startupName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-ink)" }}>
                      {profile.startupName}
                    </h2>
                    <span className="badge badge-muted">{profile.stage}</span>
                    <span className="badge badge-forest">{profile.country}</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {profile.industry} &bull; {profile.organizationType} &bull; Need: {profile.fundingNeed}
                  </p>
                </div>
              </div>

              {/* Presets and Edit Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase" }}>
                    Presets:
                  </span>
                  {PRESET_PROFILES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p.profile)}
                      className="btn-secondary"
                      style={{
                        fontSize: "0.76rem",
                        padding: "0.3rem 0.6rem",
                        backgroundColor:
                          profile.startupName === p.profile.startupName
                            ? "var(--brand-forest-light)"
                            : "var(--surface-card)",
                        borderColor:
                          profile.startupName === p.profile.startupName
                            ? "var(--brand-forest)"
                            : "var(--border-subtle)",
                        color:
                          profile.startupName === p.profile.startupName
                            ? "var(--brand-forest)"
                            : "var(--text-charcoal)",
                      }}
                    >
                      {p.profile.startupName}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem" }}
                >
                  <Edit3 size={13} />
                  {isEditingProfile ? "Close Editor" : "Edit Profile"}
                </button>
              </div>
            </div>

            {/* Inline Profile Editor Drawer */}
            {isEditingProfile && (
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    Startup Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile.startupName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, startupName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    Country
                  </label>
                  <input
                    type="text"
                    value={editedProfile.country}
                    onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    Industry Domain
                  </label>
                  <input
                    type="text"
                    value={editedProfile.industry}
                    onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      marginTop: "3px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)" }}>
                    Stage
                  </label>
                  <select
                    value={editedProfile.stage}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        stage: e.target.value as UserProfile["stage"],
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      marginTop: "3px",
                    }}
                  >
                    <option value="Idea">Idea</option>
                    <option value="Prototype">Prototype</option>
                    <option value="MVP">MVP</option>
                    <option value="Early Revenue">Early Revenue</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="btn-secondary"
                    style={{ fontSize: "0.82rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="btn-primary"
                    style={{ fontSize: "0.82rem" }}
                  >
                    Save & Recompute Matches
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DISCOVERY CONTROL BAR */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.75rem",
              boxShadow: "var(--shadow-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Top row: Status & Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  className={isLiveActive ? "badge badge-forest" : "badge badge-amber"}
                >
                  <ShieldCheck size={13} />
                  {isLiveActive ? "Engine: TinyFish Live Web" : "Benchmark Catalog (Demo Mode)"}
                </span>

                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Showing {filteredOpportunities.length} of {opportunities.length} programs
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => runDiscovery(true)}
                  disabled={isLoading}
                  className="btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 0.85rem" }}
                >
                  Demo Benchmark
                </button>

                <button
                  type="button"
                  onClick={() => runDiscovery(false)}
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
                >
                  {isLoading ? (
                    <>
                      <RotateCcw size={13} style={{ animation: "spin 1s linear infinite" }} />
                      Querying TinyFish...
                    </>
                  ) : (
                    <>
                      <Search size={13} />
                      Discover with TinyFish
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Custom query input */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={16}
                  style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}
                />
                <input
                  type="text"
                  placeholder="Custom search query (e.g. AI healthcare grants 2026, climate accelerators)..."
                  value={customSearchTerm}
                  onChange={(e) => setCustomSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runDiscovery(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem 0.6rem 2.4rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-medium)",
                    backgroundColor: "var(--surface-parchment)",
                    color: "var(--text-ink)",
                    fontSize: "0.88rem",
                  }}
                />
              </div>
            </div>

            {/* Notice / Warning Bar if any */}
            {discoveryNotice && (
              <div
                style={{
                  backgroundColor: "var(--accent-amber-light)",
                  border: "1px solid var(--accent-amber-border)",
                  color: "var(--accent-amber)",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>{discoveryNotice}</span>
              </div>
            )}
          </div>

          {/* FILTER AND SORT BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {["All", "Grant", "Accelerator", "Incubator", "Competition", "Fellowship"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: selectedCategory === cat ? 600 : 500,
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-xs)",
                    backgroundColor: selectedCategory === cat ? "var(--brand-forest)" : "var(--surface-card)",
                    color: selectedCategory === cat ? "#FFFFFF" : "var(--text-charcoal)",
                    border: `1px solid ${selectedCategory === cat ? "var(--brand-forest)" : "var(--border-medium)"}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat === "All" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            {/* Geographic & Regulatory Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
              <select
                value={selectedGeography}
                onChange={(e) => setSelectedGeography(e.target.value)}
                aria-label="Filter by Geography"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-charcoal)",
                }}
              >
                <option value="All">All Geographies</option>
                <option value="India">India (Pan-India &amp; DPIIT)</option>
                <option value="State-Specific">State Mission Specific (e.g. Karnataka)</option>
                <option value="Global">Global / Remote Programs</option>
              </select>

              <select
                value={selectedDpiit}
                onChange={(e) => setSelectedDpiit(e.target.value)}
                aria-label="Filter by DPIIT requirement"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-charcoal)",
                }}
              >
                <option value="All">All Recognition Types</option>
                <option value="DPIIT Required">DPIIT Prerequisite Only</option>
                <option value="No DPIIT Needed">Open / No DPIIT Prerequisite</option>
              </select>

              <select
                value={selectedFitTier}
                onChange={(e) => setSelectedFitTier(e.target.value)}
                aria-label="Filter by Fit Tier"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-charcoal)",
                }}
              >
                <option value="All">All Fit Tiers</option>
                <option value="High Fit">High Fit (&ge; 80%)</option>
                <option value="Moderate Fit">Moderate Fit (60&ndash;79%)</option>
                <option value="Low Fit">Low Fit (40&ndash;59%)</option>
                <option value="Disqualified / Low Fit">Disqualified / Hard Capped</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "score" | "deadline")}
                aria-label="Sort opportunities"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-charcoal)",
                }}
              >
                <option value="score">Sort by Fit Score</option>
                <option value="deadline">Sort by Deadline</option>
              </select>

              <button
                type="button"
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: showSavedOnly ? "var(--brand-forest-light)" : "var(--surface-card)",
                  color: showSavedOnly ? "var(--brand-forest)" : "var(--text-muted)",
                }}
              >
                <Bookmark size={13} />
                Saved ({savedIds.length})
              </button>
            </div>
          </div>

          {/* OPPORTUNITIES GRID */}
          {isLoading ? (
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "4rem 2rem",
                textAlign: "center",
              }}
            >
              <RotateCcw size={28} color="var(--brand-forest)" style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.3rem", color: "var(--text-ink)", marginBottom: "0.4rem" }}>
                Searching Current Program Sources...
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto" }}>
                Querying live government grant notices, scraping opportunity pages via TinyFish, and running deterministic criteria evaluation against {profile.startupName}.
              </p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "3.5rem 2rem",
                textAlign: "center",
              }}
            >
              <Compass size={32} color="var(--text-faint)" style={{ margin: "0 auto 0.75rem auto" }} />
              <h3 style={{ fontSize: "1.3rem", color: "var(--text-ink)", marginBottom: "0.4rem" }}>
                No Matching Opportunities Found
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto 1.5rem auto" }}>
                No programs currently match the active filters. Broaden your category selection, clear search filters, or test with our benchmark presets.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedGeography("All");
                  setSelectedDpiit("All");
                  setSelectedFitTier("All");
                  setShowSavedOnly(false);
                  setSearchQuery("");
                }}
                className="btn-secondary"
                style={{ fontSize: "0.85rem" }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {filteredOpportunities.map((opp) => {
                const isSaved = savedIds.includes(opp.id);
                const score = opp.match?.matchScore ?? 50;
                const isDisqualified = opp.match?.disqualificationFlag || opp.isExpired;

                let scoreBadgeClass = "badge-forest";
                if (isDisqualified) scoreBadgeClass = "badge-rose";
                else if (score >= 80) scoreBadgeClass = "badge-forest";
                else if (score >= 60) scoreBadgeClass = "badge-amber";
                else scoreBadgeClass = "badge-muted";

                return (
                  <div
                    key={opp.id}
                    style={{
                      backgroundColor: "var(--surface-card)",
                      border: `1px solid ${isDisqualified ? "var(--accent-rose-border)" : "var(--border-medium)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--shadow-subtle)",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "0.85rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                          <span className={`badge ${scoreBadgeClass}`}>
                            {opp.match?.fitTier || "Moderate Fit"} ({score}%)
                          </span>
                          <span className="badge badge-muted">{opp.category}</span>
                          {opp.dpiitRequired && (
                            <span className="badge badge-amber" style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem" }}>
                              DPIIT Prerequisite
                            </span>
                          )}
                          {opp.geographicScope === "State-Specific" && opp.eligibleStates && opp.eligibleStates.length > 0 && (
                            <span className="badge badge-forest" style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem" }}>
                              {opp.eligibleStates.join(", ")} Only
                            </span>
                          )}
                          {opp.isDemoData ? (
                            <span style={{ fontSize: "0.7rem", color: "var(--text-faint)", fontWeight: 600 }}>
                              Demo Benchmark
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.7rem", color: "var(--brand-forest)", fontWeight: 700 }}>
                              Live Discovery
                            </span>
                          )}
                        </div>

                        {/* Save Button */}
                        <button
                          type="button"
                          onClick={() => toggleSave(opp.id)}
                          aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
                          style={{
                            padding: "0.3rem",
                            color: isSaved ? "var(--brand-forest)" : "var(--text-faint)",
                          }}
                        >
                          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </div>

                      {/* Title & Provider */}
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          color: "var(--text-ink)",
                          marginBottom: "0.25rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {opp.name}
                      </h3>
                      <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        {opp.provider} &bull; {opp.geographicAvailability}
                      </p>

                      {/* Benefits & Deadline Capsule */}
                      <div
                        style={{
                          backgroundColor: "var(--surface-subtle)",
                          padding: "0.75rem",
                          borderRadius: "var(--radius-xs)",
                          border: "1px solid var(--border-subtle)",
                          marginBottom: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-ink)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <DollarSign size={14} color="var(--brand-forest)" />
                          {opp.fundingAmountOrBenefits}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: opp.isExpired ? "var(--accent-rose)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar size={13} />
                          Deadline: {opp.deadlineLabel}
                        </div>
                      </div>

                      {/* Fit Summary Reasoning */}
                      <div style={{ fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.5rem" }}>
                        {opp.isExpired ? (
                          <span style={{ color: "var(--accent-rose)", fontWeight: 500 }}>
                            &bull; Program deadline has expired. Capped at {score}%.
                          </span>
                        ) : opp.match?.disqualificationFlag ? (
                          <span style={{ color: "var(--accent-rose)", fontWeight: 500 }}>
                            &bull; {opp.match.disqualificationFlag}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-charcoal)" }}>
                            &bull; {opp.match?.summaryNote}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      style={{
                        marginTop: "1.25rem",
                        paddingTop: "0.85rem",
                        borderTop: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href={opp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        Official Source <ExternalLink size={11} />
                      </a>

                      <button
                        type="button"
                        onClick={() => openOpportunityDetails(opp)}
                        className="btn-primary"
                        style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                      >
                        Inspect & Checklist
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DETAIL INSPECTION DRAWER / MODAL */}
      {selectedOpp && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(28, 25, 23, 0.45)",
            zIndex: 50,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedOpp(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              height: "100%",
              backgroundColor: "var(--surface-card)",
              boxShadow: "var(--shadow-drawer)",
              overflowY: "auto",
              padding: "2.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <span className="badge badge-forest">{selectedOpp.category}</span>
                <button
                  type="button"
                  onClick={() => setSelectedOpp(null)}
                  aria-label="Close details"
                  style={{ padding: "0.35rem", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <h2 style={{ fontSize: "1.75rem", color: "var(--text-ink)", marginBottom: "0.35rem" }}>
                {selectedOpp.name}
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                Offered by {selectedOpp.provider} &bull; {selectedOpp.geographicAvailability}
              </p>
            </div>

            {/* Stated Facts */}
            <div
              style={{
                backgroundColor: "var(--surface-subtle)",
                padding: "1.25rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-faint)", marginBottom: "0.75rem" }}>
                Stated Program Disclosures
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Funding or Benefits</span>
                  <strong style={{ fontSize: "0.92rem", color: "var(--text-ink)" }}>{selectedOpp.fundingAmountOrBenefits}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Deadline Status</span>
                  <strong style={{ fontSize: "0.92rem", color: selectedOpp.isExpired ? "var(--accent-rose)" : "var(--text-ink)" }}>
                    {selectedOpp.deadlineLabel}
                  </strong>
                </div>
              </div>
            </div>

            {/* Grounded Match Analysis */}
            <div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.6rem" }}>
                Eligibility Analysis for {profile.startupName}
              </h3>
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: selectedOpp.match?.disqualificationFlag ? "var(--accent-rose-light)" : "var(--brand-forest-light)",
                  border: `1px solid ${selectedOpp.match?.disqualificationFlag ? "var(--accent-rose-border)" : "var(--brand-forest-border)"}`,
                  color: selectedOpp.match?.disqualificationFlag ? "var(--accent-rose)" : "var(--brand-forest)",
                  fontSize: "0.88rem",
                  marginBottom: "1rem",
                }}
              >
                <strong>Fit Tier: {selectedOpp.match?.fitTier} ({selectedOpp.match?.matchScore}%)</strong>
                <p style={{ fontSize: "0.82rem", marginTop: "3px" }}>{selectedOpp.match?.summaryNote}</p>
              </div>

              {/* Reasons */}
              {selectedOpp.match?.reasons && selectedOpp.match.reasons.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h5 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--brand-forest)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                    Confirmed Alignment Factors:
                  </h5>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.84rem", color: "var(--text-charcoal)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {selectedOpp.match.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Potential Conflicts */}
              {selectedOpp.match?.potentialConflicts && selectedOpp.match.potentialConflicts.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h5 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-rose)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                    Eligibility Barriers & Conflicts:
                  </h5>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.84rem", color: "var(--accent-rose)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {selectedOpp.match.potentialConflicts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Missing Information & Manual Verification Flags */}
              {((selectedOpp.match?.verificationNeeded && selectedOpp.match.verificationNeeded.length > 0) ||
                (selectedOpp.missingInformation && selectedOpp.missingInformation.length > 0)) && (
                <div
                  style={{
                    backgroundColor: "var(--accent-amber-light)",
                    border: "1px solid var(--accent-amber-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.85rem 1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <h5 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-amber)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                    Information Requiring Founder Verification:
                  </h5>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.82rem", color: "var(--accent-amber)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {(selectedOpp.match?.verificationNeeded || []).map((v, idx) => (
                      <li key={`v-${idx}`}>{v}</li>
                    ))}
                    {(selectedOpp.missingInformation || []).map((m, idx) => (
                      <li key={`m-${idx}`}>Portal disclosure unstated: {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Documents */}
              {selectedOpp.requiredDocuments && selectedOpp.requiredDocuments.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h5 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-ink)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                    Mandatory Submission Documents:
                  </h5>
                  <ul style={{ paddingLeft: "1.25rem", fontSize: "0.84rem", color: "var(--text-charcoal)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {selectedOpp.requiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Official Portal Link & Source Link */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <a
                href={selectedOpp.applicationUrl || selectedOpp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem 1rem" }}
              >
                Go to Official Application Portal <ExternalLink size={14} />
              </a>
              <a
                href={selectedOpp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                }}
              >
                View Primary Sponsoring Ministry / Organization Portal ({new URL(selectedOpp.sourceUrl).hostname})
                <ExternalLink size={12} />
              </a>
            </div>

            {/* APPLICATION READINESS CHECKLIST */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-ink)" }}>
                    Application Readiness Checklist
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Progress: {checklistProgress}% completed
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={handleMarkAllChecklist}
                    className="btn-secondary"
                    style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                  >
                    Mark All Done
                  </button>
                  <button
                    type="button"
                    onClick={handleResetChecklist}
                    className="btn-secondary"
                    style={{ fontSize: "0.72rem", padding: "0.25rem 0.5rem" }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: "6px", backgroundColor: "var(--surface-muted)", borderRadius: "3px", overflow: "hidden", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: `${checklistProgress}%`,
                    height: "100%",
                    backgroundColor: "var(--brand-forest)",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>

              {/* Checklist Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {checklist.map((item) => {
                  const isChecked = completedChecklistIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.6rem",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: isChecked ? "var(--surface-subtle)" : "var(--surface-card)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleChecklistItem(item.id)}
                        style={{ marginTop: "3px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong
                            style={{
                              fontSize: "0.85rem",
                              color: isChecked ? "var(--text-muted)" : "var(--text-ink)",
                              textDecoration: isChecked ? "line-through" : "none",
                            }}
                          >
                            {item.title}
                          </strong>
                          <span
                            className={
                              item.priority === "high"
                                ? "badge badge-terracotta"
                                : item.priority === "medium"
                                ? "badge badge-amber"
                                : "badge badge-muted"
                            }
                            style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {item.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
