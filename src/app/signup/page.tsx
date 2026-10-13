"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  MailCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const { isConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your legal or business full name (at least 2 characters).");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError("Please enter a valid business or founder email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation password do not match.");
      return;
    }

    if (!agreedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    if (!isConfigured) {
      setError(
        "Supabase credentials are not configured in your environment. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable cloud account registration."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/workspace`
          : "/auth/callback";

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("An account with this email address already exists. Please sign in instead.");
        } else {
          setError(signUpError.message);
        }
        setIsLoading(false);
        return;
      }

      // Check if user identity already existed (Supabase returns empty identities array when user exists and email confirmation is on)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("An account with this email address is already registered. Please sign in instead.");
        setIsLoading(false);
        return;
      }

      // If Supabase has email confirmation enabled (recommended production setup)
      setRegisteredEmail(cleanEmail);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during account registration.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3.5rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-narrow" style={{ maxWidth: "480px" }}>
          {/* Card */}
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
              <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem", color: "var(--text-ink)" }}>
                {isSubmitted ? "Verify Your Email" : "Create Your Account"}
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                {isSubmitted
                  ? "Confirm your email to activate your Oppora venture account."
                  : "Start tracking startup grants, accelerators, and deadlines."}
              </p>
            </div>

            {/* Supabase Status Banner (Truthful disclosure when unconfigured) */}
            {!isConfigured && !isSubmitted && (
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
                  <strong>Configuration Required:</strong> Supabase credentials are not yet set in <code>.env.local</code>. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable live authentication and PostgreSQL persistence. See <code>SUPABASE_SETUP.md</code> for step-by-step setup instructions.
                </div>
              </div>
            )}

            {/* Success / Verification Screen */}
            {isSubmitted ? (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div
                  style={{
                    backgroundColor: "var(--brand-forest-light)",
                    border: "1px solid var(--brand-forest-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1.5rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <MailCheck size={36} color="var(--brand-forest)" />
                  <h2 style={{ fontSize: "1.15rem", color: "var(--brand-forest)", margin: 0, fontWeight: 600 }}>
                    Verification Link Dispatched
                  </h2>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-charcoal)", lineHeight: 1.55, margin: 0 }}>
                    We have sent an authentication confirmation email to:
                    <br />
                    <strong style={{ color: "var(--text-ink)" }}>{registeredEmail}</strong>
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                    Click the verification link inside the email to activate your account and access your private founder workspace. Links expire in 24 hours.
                  </p>
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    backgroundColor: "var(--surface-subtle)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--border-subtle)",
                    textAlign: "left",
                    lineHeight: 1.45,
                  }}
                >
                  <strong>Notice:</strong> If the email does not appear in your inbox within two minutes, please inspect your spam or quarantine folder.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <Link
                    href="/login"
                    className="btn-primary"
                    style={{ justifyContent: "center", width: "100%", padding: "0.75rem" }}
                  >
                    Proceed to Sign In
                    <ArrowRight size={15} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "0.35rem",
                    }}
                  >
                    Re-enter email address or retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error Banner */}
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
                      alignItems: "flex-start",
                      gap: "0.5rem",
                      marginBottom: "1.25rem",
                      lineHeight: 1.45,
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                  <div>
                    <label
                      htmlFor="fullName"
                      style={{
                        display: "block",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        marginBottom: "0.35rem",
                        color: "var(--text-ink)",
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Aditi Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
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

                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        marginBottom: "0.35rem",
                        color: "var(--text-ink)",
                      }}
                    >
                      Work or Founder Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="founder@venture.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
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

                  <div>
                    <label
                      htmlFor="password"
                      style={{
                        display: "block",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        marginBottom: "0.35rem",
                        color: "var(--text-ink)",
                      }}
                    >
                      Password (min. 8 characters)
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        disabled={isLoading}
                        style={{
                          width: "100%",
                          padding: "0.65rem 2.5rem 0.65rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-medium)",
                          backgroundColor: "var(--surface-parchment)",
                          color: "var(--text-ink)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-faint)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      style={{
                        display: "block",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                        marginBottom: "0.35rem",
                        color: "var(--text-ink)",
                      }}
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
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

                  {/* Terms Consent Checkbox */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginTop: "0.25rem" }}>
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      required
                      disabled={isLoading}
                      style={{ marginTop: "3px" }}
                    />
                    <label htmlFor="terms" style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                      I agree to the{" "}
                      <Link href="/terms" style={{ color: "var(--brand-forest)", textDecoration: "underline" }}>
                        Terms of Service
                      </Link>{" "}
                      and acknowledge the{" "}
                      <Link href="/privacy" style={{ color: "var(--brand-forest)", textDecoration: "underline" }}>
                        Privacy Policy
                      </Link>.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                    style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem", justifyContent: "center" }}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    <ArrowRight size={15} />
                  </button>
                </form>

                {/* Footer switch */}
                <div
                  style={{
                    marginTop: "1.75rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border-subtle)",
                    textAlign: "center",
                    fontSize: "0.86rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Already have an account?{" "}
                  <Link href="/login" style={{ color: "var(--brand-forest)", fontWeight: 600 }}>
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
