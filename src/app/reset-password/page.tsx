"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isConfigured } = getSupabaseConfig();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!isConfigured) {
      setError("Database connection is not configured. Please check your Supabase environment settings.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/workspace");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password update failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "4rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-narrow" style={{ maxWidth: "440px" }}>
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "2.5rem 2rem",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <img
                src="/oppora-logo.jpg"
                alt="Oppora Logo"
                width={48}
                height={48}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid var(--border-medium)",
                  margin: "0 auto 0.75rem auto",
                  display: "block",
                  boxShadow: "var(--shadow-subtle)",
                }}
              />
              <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
                Set New Password
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Enter your new secure account password below.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  backgroundColor: "var(--accent-rose-light)",
                  border: "1px solid var(--accent-rose-border)",
                  color: "var(--accent-rose)",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success State */}
            {success ? (
              <div
                style={{
                  backgroundColor: "var(--brand-forest-light)",
                  border: "1px solid var(--brand-forest-border)",
                  color: "var(--brand-forest)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-sm)",
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={28} style={{ margin: "0 auto 0.5rem auto" }} />
                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>Password Updated!</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Your password has been changed. Redirecting to your workspace...
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                <div>
                  <label
                    htmlFor="newPassword"
                    style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-charcoal)", marginBottom: "0.35rem" }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      style={{
                        width: "100%",
                        padding: "0.65rem 2.5rem 0.65rem 0.85rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-medium)",
                        backgroundColor: "var(--surface-parchment)",
                        fontSize: "0.95rem",
                        color: "var(--text-ink)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-charcoal)", marginBottom: "0.35rem" }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-medium)",
                      backgroundColor: "var(--surface-parchment)",
                      fontSize: "0.95rem",
                      color: "var(--text-ink)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "0.75rem",
                    fontSize: "0.95rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {isLoading ? "Saving New Password..." : "Update Password & Sign In"}
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
