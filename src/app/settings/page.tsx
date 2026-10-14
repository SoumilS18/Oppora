"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { BusinessSettings } from "@/types/operations";
import {
  Settings,
  Building,
  DollarSign,
  Mail,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Clock,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    companyName: "Oppora EcoVentures Pvt Ltd",
    country: "India",
    state: "Karnataka",
    defaultCurrency: "INR",
    timezone: "Asia/Kolkata",
    businessCategory: "Sustainable Packaging & Retail",
    autoLowStockAlerts: true,
    supplierEmailAutoDraft: true,
    emailSenderName: "Operations Desk",
    replyToEmail: "ops@oppora.dev",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch settings from API
    fetch("/api/operations/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Auth user check
    const { isConfigured } = getSupabaseConfig();
    if (isConfigured) {
      try {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) setUserEmail(session.user.email || null);
        });
      } catch {}
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/operations/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", text: "Business settings saved successfully." });
      } else {
        setToast({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch {
      setToast({ type: "error", text: "Network error saving settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Settings &amp; Business Profile"
      subtitle="Configure enterprise parameters, default currency, and restock communication preferences"
    >
      <div style={{ maxWidth: "800px" }}>
        {toast && (
          <div
            style={{
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              backgroundColor: toast.type === "success" ? "var(--brand-forest-light)" : "var(--accent-rose-light)",
              border: `1px solid ${toast.type === "success" ? "var(--brand-forest-border)" : "var(--accent-rose-border)"}`,
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              color: toast.type === "success" ? "var(--brand-forest)" : "var(--accent-rose)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* SECTION 1: BUSINESS ENTITY */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Building size={18} color="var(--brand-forest)" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
                Business Profile
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                    Registered Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={settings.businessCategory}
                    onChange={(e) => setSettings({ ...settings, businessCategory: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Country</label>
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>State / Province</label>
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem", backgroundColor: "#FFFFFF" }}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                  <option value="Europe/London">Europe/London (GMT - UTC+00:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: CURRENCY & FINANCIAL RULES */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <DollarSign size={18} color="var(--brand-forest)" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
                Default Currency &amp; Financial Precision
              </h2>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                Default Operational Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value as any })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem", backgroundColor: "#FFFFFF" }}
              >
                <option value="INR">INR (₹) — Indian Rupee (Default)</option>
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="SGD">SGD (S$) — Singapore Dollar</option>
                <option value="AED">AED (AED) — UAE Dirham</option>
              </select>
            </div>

            <div
              style={{
                padding: "0.75rem 0.85rem",
                backgroundColor: "var(--accent-amber-light)",
                border: "1px solid var(--accent-amber-border)",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.78rem",
                color: "var(--accent-amber)",
                lineHeight: 1.5,
              }}
            >
              <strong>Important Currency Rule:</strong> Oppora preserves raw numeric amounts for recorded historical transactions.
              Updating your default currency affects how amounts are labelled and formatted across dashboard cards and reports, but does not retroactively rewrite historical transaction amounts.
            </div>
          </div>

          {/* SECTION 3: AUTOMATION & SUPPLIER EMAILS */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Mail size={18} color="var(--brand-forest)" />
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600 }}>
                Supplier Email &amp; Automation Preferences
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", backgroundColor: "var(--surface-subtle)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-ink)" }}>
                    Automated Low-Stock Trigger
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Continuously monitor product inventory against reorder thresholds
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoLowStockAlerts}
                  onChange={(e) => setSettings({ ...settings, autoLowStockAlerts: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", backgroundColor: "var(--surface-subtle)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-ink)" }}>
                    Auto-Draft Restock Emails
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Prepare reviewable drafts for preferred suppliers when stock is depleted (requires approval)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.supplierEmailAutoDraft}
                  onChange={(e) => setSettings({ ...settings, supplierEmailAutoDraft: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                    Email Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.emailSenderName}
                    onChange={(e) => setSettings({ ...settings, emailSenderName: e.target.value })}
                    placeholder="e.g. Operations Desk"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-charcoal)" }}>
                    Reply-To Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.replyToEmail}
                    onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                    placeholder="e.g. ops@yourcompany.com"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-medium)", marginTop: "0.25rem" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
              <Save size={16} />
              <span>{saving ? "Saving Changes..." : "Save Business Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
