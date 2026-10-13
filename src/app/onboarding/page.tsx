"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserProfile } from "@/types/opportunity";
import { DEFAULT_USER_PROFILE, PRESET_PROFILES } from "@/lib/mockData";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Form State initialized with default profile
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [keywordsInput, setKeywordsInput] = useState<string>(
    DEFAULT_USER_PROFILE.focusKeywords.join(", ")
  );
  const [error, setError] = useState<string | null>(null);

  // Quick preset loader
  const handleLoadPreset = (preset: UserProfile) => {
    setProfile(preset);
    setKeywordsInput(preset.focusKeywords.join(", "));
  };

  const handleStep1Continue = () => {
    setError(null);
    if (!profile.country.trim()) {
      setError("Please specify your company location or target country.");
      return;
    }
    if (!profile.industry.trim()) {
      setError("Please specify your industry domain.");
      return;
    }
    setStep(2);
  };

  const handleFinishOnboarding = () => {
    // Parse keywords
    const parsedKeywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const finalizedProfile: UserProfile = {
      ...profile,
      startupName: profile.startupName.trim() || "My Venture",
      focusKeywords: parsedKeywords,
    };

    try {
      localStorage.setItem("oppora_profile", JSON.stringify(finalizedProfile));
    } catch {
      // Local storage unavailable
    }

    router.push("/discover");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3.5rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-narrow" style={{ maxWidth: "680px" }}>
          {/* Preset Quick-Start Bar */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem 1.25rem",
              marginBottom: "2rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <Sparkles size={16} color="var(--brand-forest)" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-ink)" }}>
                Quick-Start Benchmark Presets:
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                (Instant configuration for judges & testers)
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {PRESET_PROFILES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleLoadPreset(p.profile)}
                  className="btn-secondary"
                  style={{
                    fontSize: "0.78rem",
                    padding: "0.35rem 0.65rem",
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
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "2.5rem 2.25rem",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Step Progress Indicator */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--brand-forest)" }}>
                  Step {step} of 2 &bull; {step === 1 ? "Essential Profile" : "Optional Venture Context"}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {step === 1 ? "Required" : "Optional Context"}
                </span>
              </div>
              <div style={{ width: "100%", height: "4px", backgroundColor: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    width: step === 1 ? "50%" : "100%",
                    height: "100%",
                    backgroundColor: "var(--brand-forest)",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>

            {/* Step Title */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
                {step === 1 ? "Tell us about your venture" : "Add technical context (Optional)"}
              </h1>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {step === 1
                  ? "Your target geography, industry sector, and development stage are essential to eliminate geographically ineligible and stage-incompatible programs."
                  : "Additional details enable deeper domain alignment and tailor your application readiness checklist."}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  backgroundColor: "var(--accent-rose-light)",
                  border: "1px solid var(--accent-rose-border)",
                  color: "var(--accent-rose)",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Step 1 Fields */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="country"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Country / Primary Domicile <span style={{ color: "var(--accent-terracotta)" }}>*</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={profile.country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      const isInd = newCountry.toLowerCase().includes("india");
                      setProfile({
                        ...profile,
                        country: newCountry,
                        region: isInd ? "Asia-Pacific" : profile.region,
                      });
                    }}
                    placeholder="e.g. India, United States, Germany, United Kingdom"
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.35rem" }}>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, country: "India", region: "Asia-Pacific", state: "Karnataka" })}
                      style={{
                        fontSize: "0.74rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: profile.country.toLowerCase() === "india" ? "var(--brand-forest-light)" : "var(--surface-card)",
                        color: profile.country.toLowerCase() === "india" ? "var(--brand-forest)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      India (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, country: "United States", region: "North America", state: "California" })}
                      style={{
                        fontSize: "0.74rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: profile.country.toLowerCase().includes("united states") ? "var(--brand-forest-light)" : "var(--surface-card)",
                        color: profile.country.toLowerCase().includes("united states") ? "var(--brand-forest)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      United States
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, country: "Germany", region: "European Union", state: "Berlin" })}
                      style={{
                        fontSize: "0.74rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: profile.country.toLowerCase().includes("germany") ? "var(--brand-forest-light)" : "var(--surface-card)",
                        color: profile.country.toLowerCase().includes("germany") ? "var(--brand-forest)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Germany / EU
                    </button>
                  </div>
                </div>

                {/* State / Union Territory (Crucial for Indian State Missions) */}
                <div>
                  <label
                    htmlFor="state"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    State / Region Jurisdiction
                  </label>
                  {profile.country.toLowerCase().includes("india") ? (
                    <select
                      id="state"
                      value={profile.state || "Karnataka"}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--surface-parchment)",
                        color: "var(--text-ink)",
                      }}
                    >
                      <option value="Karnataka">Karnataka (ELEVATE &amp; Bengaluru Ecosystem)</option>
                      <option value="Maharashtra">Maharashtra (Mumbai / Pune TBI)</option>
                      <option value="Delhi NCR">Delhi NCR (IIT Delhi &amp; MeitY Hub)</option>
                      <option value="Tamil Nadu">Tamil Nadu (IIT Madras &amp; TANSIM)</option>
                      <option value="Telangana">Telangana (T-Hub / IIIT Hyderabad)</option>
                      <option value="Gujarat">Gujarat (iCreate &amp; GSFC)</option>
                      <option value="Kerala">Kerala (Kerala Startup Mission - KSUM)</option>
                      <option value="Uttar Pradesh">Uttar Pradesh (IIT Kanpur / S&amp;T)</option>
                      <option value="West Bengal">West Bengal (Kolkata / Eastern Hub)</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Rajasthan">Rajasthan (iStart)</option>
                      <option value="Other State / UT">Other Indian State / Union Territory</option>
                    </select>
                  ) : (
                    <input
                      id="state"
                      type="text"
                      value={profile.state || ""}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      placeholder="e.g. California, Berlin, Ontario"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--surface-parchment)",
                        color: "var(--text-ink)",
                      }}
                    />
                  )}
                  <span style={{ fontSize: "0.76rem", color: "var(--text-faint)", marginTop: "0.25rem", display: "block" }}>
                    Enables matching with state startup missions (e.g. Karnataka ELEVATE) and regional university incubators.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="region"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Economic Bloc
                  </label>
                  <select
                    id="region"
                    value={profile.region}
                    onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  >
                    <option value="Asia-Pacific">Asia-Pacific (India &amp; APAC)</option>
                    <option value="North America">North America (US &amp; Canada)</option>
                    <option value="European Union">European Union</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Global">Global / Remote</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="industry"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Industry / Technology Domain <span style={{ color: "var(--accent-terracotta)" }}>*</span>
                  </label>
                  <input
                    id="industry"
                    type="text"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    placeholder="e.g. HealthTech & AI, MedTech, DeepTech & Hardware, AgriTech"
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                  <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    {["HealthTech & AI", "DeepTech", "MedTech & Devices", "AgriTech", "CleanTech & Sustainability", "B2B SaaS"].map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setProfile({ ...profile, industry: ind })}
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-xs)",
                          border: "1px solid var(--border-subtle)",
                          backgroundColor: profile.industry === ind ? "var(--brand-forest-light)" : "var(--surface-card)",
                          color: profile.industry === ind ? "var(--brand-forest)" : "var(--text-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="stage"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Current Development Stage <span style={{ color: "var(--accent-terracotta)" }}>*</span>
                  </label>
                  <select
                    id="stage"
                    value={profile.stage}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        stage: e.target.value as UserProfile["stage"],
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  >
                    <option value="Idea">Idea (Concept / Literature Review / EiR)</option>
                    <option value="Prototype">Prototype (Working Lab Prototype / TRL 3&ndash;5)</option>
                    <option value="MVP">MVP (Alpha Pilot / Clinical Trials / Beta User Testing)</option>
                    <option value="Early Revenue">Early Revenue (Commercial Traction / Market Entry)</option>
                    <option value="Scaling">Scaling (Series A / Production Deployment)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={handleStep1Continue}
                    className="btn-primary"
                    style={{ padding: "0.75rem 1.5rem" }}
                  >
                    Continue to Context <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Fields */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="startupName"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Startup / Project Name
                  </label>
                  <input
                    id="startupName"
                    type="text"
                    value={profile.startupName}
                    onChange={(e) => setProfile({ ...profile, startupName: e.target.value })}
                    placeholder="e.g. KavachBio Diagnostics"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                </div>

                {/* Entity Legal Type */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      htmlFor="entityType"
                      style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                    >
                      Legal Entity Structure
                    </label>
                    <select
                      id="entityType"
                      value={profile.entityType || "Private Limited (Pvt Ltd)"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          entityType: e.target.value as UserProfile["entityType"],
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--surface-parchment)",
                        color: "var(--text-ink)",
                      }}
                    >
                      <option value="Private Limited (Pvt Ltd)">Private Limited (Pvt Ltd)</option>
                      <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                      <option value="Registered Partnership">Registered Partnership</option>
                      <option value="Sole Proprietorship / Unregistered">Sole Proprietorship / Unregistered</option>
                      <option value="Student / Academic Project">Student / Academic Project</option>
                      <option value="Other / Unspecified">Other / Unspecified</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="organizationType"
                      style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                    >
                      Founder Classification
                    </label>
                    <select
                      id="organizationType"
                      value={profile.organizationType}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          organizationType: e.target.value as UserProfile["organizationType"],
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--surface-parchment)",
                        color: "var(--text-ink)",
                      }}
                    >
                      <option value="Incorporated Startup">Incorporated Startup (Pvt Ltd / LLP)</option>
                      <option value="Early-Stage Team">Early-Stage Team (Unincorporated)</option>
                      <option value="Student Founder">Student Founder (University Affiliated)</option>
                      <option value="Solo Founder">Solo Founder</option>
                      <option value="Research Spinout">Research Spinout (Academic / CSIR / IIT)</option>
                    </select>
                  </div>
                </div>

                {/* DPIIT Startup Recognition Field (India-specific context) */}
                <div
                  style={{
                    backgroundColor: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.9rem 1rem",
                  }}
                >
                  <label
                    htmlFor="dpiit"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--text-ink)" }}
                  >
                    DPIIT Startup Recognition Status (Startup India)
                  </label>
                  <select
                    id="dpiit"
                    value={profile.dpiitRecognized || "In Progress / Not Sure"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        dpiitRecognized: e.target.value as UserProfile["dpiitRecognized"],
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-card)",
                      color: "var(--text-ink)",
                    }}
                  >
                    <option value="Yes">Yes &bull; Recognized by DPIIT (Certificate issued)</option>
                    <option value="No">No &bull; Not yet registered on Startup India</option>
                    <option value="In Progress / Not Sure">In Progress / Not Sure</option>
                  </select>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "block" }}>
                    DPIIT recognition is free and issued via startupindia.gov.in. It is required for the Startup India Seed Fund Scheme (SISFS) and Section 56 tax exemptions, but not mandatory for university grants or competitions.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="fundingNeed"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Target Funding or Resource Need
                  </label>
                  <input
                    id="fundingNeed"
                    type="text"
                    value={profile.fundingNeed}
                    onChange={(e) => setProfile({ ...profile, fundingNeed: e.target.value })}
                    placeholder="e.g. ₹20 Lakhs - ₹50 Lakhs non-dilutive grant / incubator seed"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="keywords"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Technical Keywords (comma-separated)
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    placeholder="e.g. MedTech, point-of-care, AI diagnostics, biomedical hardware"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Brief Venture Summary (1–2 sentences)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Developing portable, automated hematology point-of-care diagnostic devices for district clinics..."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      color: "var(--text-ink)",
                    }}
                  />
                </div>

                {/* Step 2 Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                    style={{ padding: "0.75rem 1.25rem" }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="btn-secondary"
                      style={{ padding: "0.75rem 1.25rem" }}
                    >
                      Skip Optional
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="btn-primary"
                      style={{ padding: "0.75rem 1.5rem" }}
                    >
                      Complete & Find Programs <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
