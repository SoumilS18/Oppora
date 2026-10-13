"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

export default function OpporaPage() {
  // State
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  const [opportunities, setOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customSearchTerm, setCustomSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
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

  // Initialize with initial matched benchmark data and load local storage
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

    // Initial match calculation against profile
    const initialMatched = SAMPLE_OPPORTUNITIES.map((opp) => ({
      ...opp,
      isDemoData: true,
      match: evaluateOpportunityMatch(opp, initialProf),
    })).sort((a, b) => (b.match?.matchScore ?? 0) - (a.match?.matchScore ?? 0));

    setOpportunities(initialMatched);
  }, []);

  // Check health and credential configuration from backend
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

  // Switch to a preset profile
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
      setDiscoveryNotice(`Request note: ${errMsg}. Serving verified benchmark catalog.`);
      // Local fallback
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

  // Toggle bookmark
  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("oppora_saved_ids", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Open detailed opportunity & checklist
  const openOpportunityDetails = (opp: OpportunityWithMatch) => {
    setSelectedOpp(opp);
    const generated = generateApplicationChecklist(opp);
    setChecklist(generated);

    // Retrieve saved completed items for this specific opportunity
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

  // Toggle checklist item and persist in localStorage
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

  // Checklist bulk helpers
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

  // Save profile updates and recompute match scores
  const handleSaveProfile = () => {
    setProfile(editedProfile);
    try {
      localStorage.setItem("oppora_profile", JSON.stringify(editedProfile));
    } catch {}
    setIsEditingProfile(false);

    // Re-score currently loaded opportunities against updated profile
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
          return (
            new Date(a.applicationDeadline).getTime() -
            new Date(b.applicationDeadline).getTime()
          );
        }
        return 0;
      });
  }, [opportunities, showSavedOnly, savedIds, selectedCategory, selectedFitTier, searchQuery, sortBy]);

  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    return Math.round((completedChecklistIds.length / checklist.length) * 100);
  }, [checklist, completedChecklistIds]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(7, 11, 20, 0.88)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {/* Logo & Tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)",
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    background: "linear-gradient(to right, #FFFFFF, #94A3B8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Oppora
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    background: "rgba(6, 182, 212, 0.15)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                  }}
                >
                  AZINHACK &apos;26
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Better Opportunities. Smarter Moves.
              </p>
            </div>
          </div>

          {/* Engine Status & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* TinyFish Status Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.8rem",
              }}
            >
              <span className={`pulse-indicator ${!isLiveActive ? "demo" : ""}`} />
              <span style={{ color: "var(--text-secondary)" }}>
                Engine:{" "}
                <strong style={{ color: isLiveActive ? "var(--accent-cyan)" : "#FBBF24" }}>
                  {isLiveActive ? "TinyFish Live Web" : "Benchmark Catalog (Demo)"}
                </strong>
              </span>
            </div>

            {/* Saved Opportunities Button */}
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className="btn btn-secondary"
              style={{
                borderColor: showSavedOnly ? "var(--accent-cyan)" : "var(--border-subtle)",
                color: showSavedOnly ? "var(--accent-cyan)" : "var(--text-primary)",
              }}
              title="Filter by bookmarked opportunities"
            >
              <Bookmark size={15} />
              Saved ({savedIds.length})
            </button>

            {/* Edit Profile Button */}
            <button
              onClick={() => {
                setEditedProfile(profile);
                setIsEditingProfile(true);
              }}
              className="btn btn-primary"
            >
              <Edit3 size={15} />
              Profile: {profile.startupName}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "2rem 0" }}>
        <div className="container">
          {/* Quick Preset Selector Bar for Demo Walkthrough */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              padding: "0.6rem 1rem",
              background: "rgba(13, 20, 36, 0.6)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)" }}>
              <SlidersHorizontal size={14} color="var(--accent-cyan)" />
              <strong style={{ color: "var(--text-primary)" }}>Judge Preset Switcher:</strong>
              <span>Test eligibility &amp; conflict dynamics instantly:</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {PRESET_PROFILES.map((p) => {
                const isSelected = profile.startupName === p.profile.startupName;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleSelectPreset(p.profile)}
                    className="btn"
                    style={{
                      padding: "0.3rem 0.75rem",
                      fontSize: "0.75rem",
                      minHeight: "32px",
                      borderRadius: "6px",
                      background: isSelected ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.04)",
                      color: isSelected ? "var(--accent-cyan)" : "var(--text-secondary)",
                      border: `1px solid ${isSelected ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {p.label} ({p.tag})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero & Profile Overview Bar */}
          <section style={{ marginBottom: "2rem" }}>
            <div
              className="card-glass"
              style={{
                padding: "2rem",
                background:
                  "linear-gradient(135deg, rgba(13, 20, 36, 0.9) 0%, rgba(17, 26, 46, 0.85) 100%)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="hero-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: "2rem",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span className="badge badge-grant">
                      <ShieldCheck size={13} /> Grounded Opportunity Intelligence
                    </span>
                    <span className="badge badge-accelerator">
                      <Globe size={13} /> Powered by TinyFish Web APIs
                    </span>
                  </div>
                  <h1 style={{ fontSize: "2rem", lineHeight: 1.25, marginBottom: "0.75rem" }}>
                    Discover &amp; Qualify Startup Opportunities with Precision
                  </h1>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                    Oppora searches, extracts, and computes grounded eligibility scores for startup grants,
                    accelerators, and fellowships using TinyFish live Search &amp; Fetch web APIs.
                  </p>

                  {/* Search query override bar & discovery buttons */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                      <Search
                        size={18}
                        color="var(--text-muted)"
                        style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                      />
                      <input
                        type="text"
                        value={customSearchTerm}
                        onChange={(e) => setCustomSearchTerm(e.target.value)}
                        placeholder={`Search query (e.g., "${profile.industry} grants 2026")...`}
                        className="input-field"
                        style={{ paddingLeft: "2.75rem" }}
                      />
                    </div>
                    <button
                      onClick={() => runDiscovery(false)}
                      disabled={isLoading}
                      className="btn btn-primary"
                      style={{ minWidth: "190px" }}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Querying TinyFish...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Discover with TinyFish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => runDiscovery(true)}
                      disabled={isLoading}
                      className="btn btn-secondary"
                      title="Load high-fidelity verified benchmark opportunities"
                    >
                      Demo Benchmark
                    </button>
                  </div>
                </div>

                {/* Active Profile Snapshot Card */}
                <div
                  style={{
                    background: "rgba(9, 15, 30, 0.7)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Active Profile
                      </span>
                      <h3 style={{ fontSize: "1.1rem" }}>{profile.startupName}</h3>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="btn btn-outline-cyan"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", minHeight: "32px" }}
                    >
                      Modify
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.825rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Domain:</span>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.industry}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Current Stage:</span>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.stage}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Location:</span>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {profile.country} ({profile.region})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Entity Status:</span>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {profile.organizationType}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.6rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Focus Keywords:</span>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                      {profile.focusKeywords.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "0.7rem",
                            background: "rgba(255, 255, 255, 0.05)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Banner */}
              {discoveryNotice && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: isLiveActive ? "rgba(6, 182, 212, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    border: `1px solid ${isLiveActive ? "rgba(6, 182, 212, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                    fontSize: "0.85rem",
                    color: isLiveActive ? "var(--accent-cyan)" : "#FBBF24",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isLiveActive ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{discoveryNotice}</span>
                </div>
              )}
            </div>
          </section>

          {/* Opportunity Filters & Controls */}
          <section style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: "var(--bg-secondary)",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Category Pills */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  "All",
                  "Grant",
                  "Accelerator",
                  "Incubator",
                  "Competition",
                  "Fellowship",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="btn"
                    style={{
                      padding: "0.4rem 0.85rem",
                      fontSize: "0.8rem",
                      minHeight: "34px",
                      borderRadius: "6px",
                      background:
                        selectedCategory === cat
                          ? "rgba(6, 182, 212, 0.2)"
                          : "rgba(255, 255, 255, 0.04)",
                      color: selectedCategory === cat ? "var(--accent-cyan)" : "var(--text-secondary)",
                      border: `1px solid ${
                        selectedCategory === cat ? "var(--accent-cyan)" : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search in results & Sorting */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter cards..."
                    className="input-field"
                    style={{ paddingLeft: "2.25rem", padding: "0.45rem 2.25rem", fontSize: "0.8rem" }}
                  />
                </div>

                {/* Fit Filter */}
                <select
                  value={selectedFitTier}
                  onChange={(e) => setSelectedFitTier(e.target.value)}
                  className="input-field"
                  style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                >
                  <option value="All">All Fit Levels</option>
                  <option value="High Fit">High Fit (80%+)</option>
                  <option value="Moderate Fit">Moderate Fit (60-79%)</option>
                  <option value="Low Fit">Low Fit (40-59%)</option>
                  <option value="Disqualified / Low Fit">Disqualified / Ineligible</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "score" | "deadline")}
                  className="input-field"
                  style={{ padding: "0.45rem 0.75rem", fontSize: "0.8rem", width: "auto" }}
                >
                  <option value="score">Sort by: Match Score</option>
                  <option value="deadline">Sort by: Deadline</option>
                </select>
              </div>
            </div>
          </section>

          {/* Results Summary Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              Showing <strong>{filteredOpportunities.length}</strong> opportunities
              {showSavedOnly ? " (Bookmarked only)" : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem" }}>
                * Match score is an estimated relevance score grounded in source documents, not an endorsement.
              </span>
            </div>
          </div>

          {/* Opportunity Cards Grid */}
          <div
            className="cards-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: "1.25rem",
              marginBottom: "3rem",
            }}
          >
            {filteredOpportunities.map((opp) => {
              const isSaved = savedIds.includes(opp.id);
              const score = opp.match?.matchScore ?? 50;
              const fitTier = opp.match?.fitTier ?? "Moderate Fit";

              let badgeScoreClass = "badge-score-moderate";
              if (score >= 80) badgeScoreClass = "badge-score-high";
              else if (score < 40 || opp.isExpired || opp.match?.disqualificationFlag) badgeScoreClass = "badge-score-low";

              let categoryBadgeClass = "badge-grant";
              if (opp.category === "Accelerator") categoryBadgeClass = "badge-accelerator";
              if (opp.category === "Incubator") categoryBadgeClass = "badge-incubator";
              if (opp.category === "Competition") categoryBadgeClass = "badge-competition";
              if (opp.category === "Fellowship") categoryBadgeClass = "badge-fellowship";

              return (
                <div
                  key={opp.id}
                  className="card-glass"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "1.5rem",
                    borderLeft: `4px solid ${
                      opp.isExpired || opp.match?.disqualificationFlag
                        ? "#F43F5E"
                        : score >= 80
                        ? "#10B981"
                        : score >= 60
                        ? "#F59E0B"
                        : "#F43F5E"
                    }`,
                  }}
                >
                  <div>
                    {/* Top Row: Category, Live/Demo Badge, Bookmark */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span className={`badge ${categoryBadgeClass}`}>{opp.category}</span>
                        {opp.isDemoData ? (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#FBBF24",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              borderRadius: "4px",
                              padding: "0.15rem 0.4rem",
                              fontWeight: 600,
                            }}
                          >
                            Demo Benchmark
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(6, 182, 212, 0.15)",
                              color: "var(--accent-cyan)",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                              borderRadius: "4px",
                              padding: "0.15rem 0.4rem",
                              fontWeight: 600,
                            }}
                          >
                            Live Web Extracted
                          </span>
                        )}

                        {opp.isExpired && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(244, 63, 94, 0.2)",
                              color: "#FB7185",
                              border: "1px solid rgba(244, 63, 94, 0.4)",
                              borderRadius: "4px",
                              padding: "0.15rem 0.4rem",
                              fontWeight: 700,
                            }}
                          >
                            Expired
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleSave(opp.id)}
                        style={{
                          background: "transparent",
                          color: isSaved ? "var(--accent-cyan)" : "var(--text-muted)",
                          padding: "0.25rem",
                        }}
                        title={isSaved ? "Remove from bookmarks" : "Bookmark opportunity"}
                      >
                        {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                    </div>

                    {/* Opportunity Title & Provider */}
                    <h3 style={{ fontSize: "1.15rem", marginBottom: "0.25rem" }}>{opp.name}</h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--accent-cyan)", marginBottom: "0.75rem" }}>
                      {opp.provider}
                    </div>

                    {/* Score Bar & Tier */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.6rem 0.75rem",
                        background: "rgba(9, 15, 30, 0.6)",
                        borderRadius: "8px",
                        marginBottom: "0.85rem",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                          Profile Relevance Score
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                          <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{score}%</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            ({fitTier})
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${badgeScoreClass}`}>{fitTier}</span>
                    </div>

                    {/* Short Description */}
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginBottom: "1rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {opp.shortDescription}
                    </p>

                    {/* Metadata tags: Funding & Deadline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                        <DollarSign size={14} color="var(--accent-emerald)" />
                        <span style={{ color: "var(--text-primary)" }}>
                          {opp.fundingAmountOrBenefits}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                        <Calendar size={14} color={opp.isExpired ? "var(--accent-rose)" : "var(--accent-amber)"} />
                        <span style={{ color: opp.isExpired ? "#FB7185" : "var(--text-primary)" }}>
                          Deadline: <strong>{opp.deadlineLabel}</strong>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
                        <MapPin size={14} color="var(--accent-cyan)" />
                        <span style={{ color: "var(--text-muted)" }}>
                          {opp.geographicAvailability}
                        </span>
                      </div>
                    </div>

                    {/* Critical Disqualification Box if present */}
                    {opp.match?.disqualificationFlag && (
                      <div
                        style={{
                          background: "rgba(244, 63, 94, 0.1)",
                          border: "1px solid rgba(244, 63, 94, 0.35)",
                          borderRadius: "6px",
                          padding: "0.5rem 0.75rem",
                          marginBottom: "0.75rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#FB7185", fontWeight: 700 }}>
                          <AlertCircle size={14} />
                          Disqualifying Barrier Flag
                        </div>
                        <div style={{ color: "#FCA5A5", marginTop: "0.2rem" }}>
                          {opp.match.disqualificationFlag}
                        </div>
                      </div>
                    )}

                    {/* Grounded Match Reasons preview */}
                    {opp.match?.reasons && opp.match.reasons.length > 0 && !opp.match?.disqualificationFlag && (
                      <div
                        style={{
                          background: "rgba(16, 185, 129, 0.06)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          borderRadius: "6px",
                          padding: "0.5rem 0.75rem",
                          marginBottom: "0.75rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#34D399", fontWeight: 600 }}>
                          <CheckCircle2 size={13} />
                          Key Synergy Grounding
                        </div>
                        <div style={{ color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                          {opp.match.reasons[0]}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Source link and Details button */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "1rem",
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Globe size={13} />
                      Source Webpage
                      <ExternalLink size={11} />
                    </a>

                    <button
                      onClick={() => openOpportunityDetails(opp)}
                      className="btn btn-outline-cyan"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem", minHeight: "34px" }}
                    >
                      Inspect &amp; Checklist
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredOpportunities.length === 0 && (
            <div
              className="card-glass"
              style={{
                textAlign: "center",
                padding: "3.5rem 2rem",
                color: "var(--text-muted)",
              }}
            >
              <HelpCircle size={40} style={{ margin: "0 auto 1rem", color: "var(--accent-cyan)" }} />
              <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                No Opportunities Found Matching Your Filter
              </h3>
              <p style={{ maxWidth: "450px", margin: "0 auto 1.5rem", fontSize: "0.9rem" }}>
                Try adjusting your category pills, clearing fit level restrictions, or running a broader
                TinyFish search.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedFitTier("All");
                  setSearchQuery("");
                  setShowSavedOnly(false);
                }}
                className="btn btn-primary"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL & APPLICATION CHECKLIST */}
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "820px" }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "1.5rem",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span className="badge badge-grant">{selectedOpp.category}</span>
                  <span className="badge badge-score-high">
                    {selectedOpp.match?.matchScore}% Relevance ({selectedOpp.match?.fitTier})
                  </span>
                  {selectedOpp.isDemoData ? (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "rgba(245, 158, 11, 0.15)",
                        color: "#FBBF24",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                      }}
                    >
                      Demo Benchmark
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "rgba(6, 182, 212, 0.15)",
                        color: "var(--accent-cyan)",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                      }}
                    >
                      Live Web Extracted
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: "1.35rem" }}>{selectedOpp.name}</h2>
                <div style={{ color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                  Provided by {selectedOpp.provider}
                </div>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                style={{
                  background: "transparent",
                  color: "var(--text-muted)",
                  padding: "0.25rem",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Grounded Match Explanation Section */}
              <div
                style={{
                  background: "rgba(9, 15, 30, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4
                    style={{
                      fontSize: "0.95rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    <ShieldCheck size={18} />
                    Grounded Eligibility &amp; Match Analysis
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Data Confidence: {selectedOpp.match?.confidenceScore ?? 80}%
                  </span>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  {selectedOpp.match?.summaryNote}
                </p>

                {/* Confirmed Matches */}
                {selectedOpp.match?.reasons && selectedOpp.match.reasons.length > 0 && (
                  <div style={{ marginBottom: "0.85rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#34D399", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Confirmed Synergy Factors:
                    </div>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {selectedOpp.match.reasons.map((r, i) => (
                        <li key={i} style={{ marginBottom: "0.25rem" }}>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Conflicts / Ineligibility */}
                {selectedOpp.match?.potentialConflicts && selectedOpp.match.potentialConflicts.length > 0 && (
                  <div style={{ marginBottom: "0.85rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#FB7185", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Eligibility Flags &amp; Constraints:
                    </div>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {selectedOpp.match.potentialConflicts.map((c, i) => (
                        <li key={i} style={{ marginBottom: "0.25rem" }}>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Manual Verification Needed */}
                {selectedOpp.match?.verificationNeeded && selectedOpp.match.verificationNeeded.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "#FBBF24", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Manual Founder Verification Required:
                    </div>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {selectedOpp.match.verificationNeeded.map((v, i) => (
                        <li key={i} style={{ marginBottom: "0.25rem" }}>
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Documented Program Specifications */}
              <div>
                <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
                  Documented Specifications &amp; Source Details
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    fontSize: "0.825rem",
                    background: "rgba(255, 255, 255, 0.02)",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Geography:</span>
                    <div>{selectedOpp.geographicAvailability}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Application Deadline:</span>
                    <div style={{ fontWeight: 600, color: selectedOpp.isExpired ? "#FB7185" : "var(--accent-amber)" }}>
                      {selectedOpp.deadlineLabel}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Funding / Benefits:</span>
                    <div>{selectedOpp.fundingAmountOrBenefits}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Eligible Stages:</span>
                    <div>{selectedOpp.stageRequirements.join(", ") || "Unstated in excerpt"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Target Industries:</span>
                    <div>{selectedOpp.industryRequirements.join(", ") || "Sector Agnostic"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Primary Source URL:</span>
                    <div>
                      <a
                        href={selectedOpp.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        {selectedOpp.sourceUrl.replace("https://", "")}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* APPLICATION READINESS CHECKLIST */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <h4 style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckSquare size={16} color="var(--accent-cyan)" />
                    Application Readiness Checklist ({completedChecklistIds.length}/{checklist.length})
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={handleMarkAllChecklist}
                      style={{ background: "transparent", color: "var(--accent-cyan)", fontSize: "0.75rem", textDecoration: "underline" }}
                    >
                      Mark all done
                    </button>
                    <button
                      onClick={handleResetChecklist}
                      style={{ background: "transparent", color: "var(--text-muted)", fontSize: "0.75rem", textDecoration: "underline" }}
                    >
                      Reset
                    </button>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                      {checklistProgress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "3px",
                    overflow: "hidden",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${checklistProgress}%`,
                      background: "linear-gradient(90deg, #06B6D4, #10B981)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Checklist Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {checklist.map((item) => {
                    const isChecked = completedChecklistIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          background: isChecked
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(255, 255, 255, 0.02)",
                          border: `1px solid ${
                            isChecked ? "rgba(16, 185, 129, 0.3)" : "var(--border-subtle)"
                          }`,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ marginTop: "0.2rem", accentColor: "var(--accent-cyan)" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                textDecoration: isChecked ? "line-through" : "none",
                                color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "4px",
                                background:
                                  item.category === "Provider Requirement"
                                    ? "rgba(59, 130, 246, 0.15)"
                                    : item.category === "Manual Verification"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(139, 92, 246, 0.15)",
                                color:
                                  item.category === "Provider Requirement"
                                    ? "#60A5FA"
                                    : item.category === "Manual Verification"
                                    ? "#FBBF24"
                                    : "#A78BFA",
                              }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Retrieved: {new Date(selectedOpp.retrievedAt).toLocaleDateString()}
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setSelectedOpp(null)} className="btn btn-secondary">
                  Close
                </button>
                <a
                  href={selectedOpp.applicationUrl || selectedOpp.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open Official Application Portal
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE ONBOARDING & EDIT MODAL */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Edit3 size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1.2rem" }}>Edit Startup Profile</h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                style={{ background: "transparent", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Presets in modal */}
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                  Quick Fill from Benchmark Presets:
                </span>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {PRESET_PROFILES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setEditedProfile(p.profile)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        borderRadius: "4px",
                        background: "rgba(6, 182, 212, 0.1)",
                        color: "var(--accent-cyan)",
                        border: "1px solid rgba(6, 182, 212, 0.25)",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  Startup / Project Name
                </label>
                <input
                  type="text"
                  value={editedProfile.startupName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, startupName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Industry or Domain
                  </label>
                  <input
                    type="text"
                    value={editedProfile.industry}
                    onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Development Stage
                  </label>
                  <select
                    value={editedProfile.stage}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, stage: e.target.value as UserProfile["stage"] })
                    }
                    className="input-field"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Prototype">Prototype</option>
                    <option value="MVP">MVP</option>
                    <option value="Early Revenue">Early Revenue</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Country of Incorporation / Base
                  </label>
                  <input
                    type="text"
                    value={editedProfile.country}
                    onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                    Geographic Region
                  </label>
                  <input
                    type="text"
                    value={editedProfile.region}
                    onChange={(e) => setEditedProfile({ ...editedProfile, region: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  Organization Type
                </label>
                <select
                  value={editedProfile.organizationType}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      organizationType: e.target.value as UserProfile["organizationType"],
                    })
                  }
                  className="input-field"
                >
                  <option value="Student Founder">Student Founder</option>
                  <option value="Solo Founder">Solo Founder</option>
                  <option value="Early-Stage Team">Early-Stage Team</option>
                  <option value="Incorporated Startup">Incorporated Startup</option>
                  <option value="Research Spinout">Research Spinout</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  Funding Needs &amp; Objectives
                </label>
                <input
                  type="text"
                  value={editedProfile.fundingNeed}
                  onChange={(e) => setEditedProfile({ ...editedProfile, fundingNeed: e.target.value })}
                  className="input-field"
                  placeholder="e.g. $100k-$500k non-dilutive grant or pre-seed"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  Description &amp; Problem Solved
                </label>
                <textarea
                  rows={3}
                  value={editedProfile.description}
                  onChange={(e) => setEditedProfile({ ...editedProfile, description: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setEditedProfile(DEFAULT_USER_PROFILE)}
                className="btn btn-secondary"
                style={{ fontSize: "0.8rem", minHeight: "34px" }}
              >
                Reset to Default
              </button>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="btn btn-secondary"
                  style={{ minHeight: "34px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary"
                  style={{ minHeight: "34px" }}
                >
                  Save &amp; Update Matches
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "2rem 0",
          background: "var(--bg-primary)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <strong>Oppora</strong> — AI-Powered Startup Opportunity Intelligence Platform. Built for{" "}
            <strong>AZINHACK &apos;26</strong>.
          </div>
          <div>
            Powered by <strong>TinyFish Search &amp; Fetch APIs</strong>. Real-time web intelligence for
            high-impact founders.
          </div>
        </div>
      </footer>
    </div>
  );
}
