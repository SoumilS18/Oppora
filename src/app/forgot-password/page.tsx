"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, Info } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isConfigured) {
      setError(
        "Supabase credentials are not configured in your environment. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable real password recovery."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to initiate password reset. Please try again.";
      setError(message);
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
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                marginBottom: "1.5rem",
              }}
            >
              <ArrowLeft size={13} /> Back to Sign In
            </Link>

            <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
              <img
                src="/oppora-logo.jpg"
                alt="Oppora Logo"
                width={44}
                height={44}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid var(--border-medium)",
                  margin: "0 auto 0.75rem auto",
                  display: "block",
                  boxShadow: "var(--shadow-subtle)",
                }}
              />
              <h1 style={{ fontSize: "1.9rem", marginBottom: "0.4rem", color: "var(--text-ink)" }}>
                Reset Password
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Enter your account email to receive a secure recovery link.
              </p>
            </div>

            {/* Supabase Status Banner */}
            {!isConfigured && !submitted && (
              <div
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem 1rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "0.6rem",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                <Info size={16} color="var(--brand-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Configuration Required:</strong> Supabase credentials are not set in <code>.env.local</code>. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable live password reset.
                </div>
              </div>
            )}

            {submitted ? (
              <div
                style={{
                  backgroundColor: "var(--brand-forest-light)",
                  border: "1px solid var(--brand-forest-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1.25rem",
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={32} color="var(--brand-forest)" style={{ margin: "0 auto 0.75rem auto" }} />
                <h3 style={{ fontSize: "1.1rem", color: "var(--brand-forest)", marginBottom: "0.35rem" }}>
                  Instructions Dispatched
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-charcoal)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  If an account exists for <strong>{email}</strong>, we have dispatched a password reset link. Please check your inbox and spam folder.
                </p>
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", fontSize: "0.88rem" }}
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {error && (
                  <div
                    style={{
                      backgroundColor: "var(--accent-rose-light)",
                      border: "1px solid var(--accent-rose-border)",
                      color: "var(--accent-rose)",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                  >
                    Account Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="founder@venture.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.75rem", justifyContent: "center" }}
                >
                  {isLoading ? "Sending Link..." : "Send Reset Link"}
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
