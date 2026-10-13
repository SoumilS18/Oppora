"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Info } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid business email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedTerms) {
      setError("You must agree to the Terms and Conditions and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    // Client-side demonstration setup: transition smoothly to startup onboarding
    setTimeout(() => {
      setIsLoading(false);
      router.push("/onboarding");
    }, 400);
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
              <h1 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
                Create Your Account
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Start tracking startup grants, accelerators, and deadlines.
              </p>
            </div>

            {/* Incomplete Auth Notice (Truthful disclosure) */}
            <div
              style={{
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem 0.9rem",
                marginBottom: "1.5rem",
                display: "flex",
                gap: "0.6rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: 1.45,
              }}
            >
              <Info size={16} color="var(--brand-forest)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Hackathon Demo Mode:</strong> Cloud authentication provider is disconnected. Completing this form will initialize your local session and guide you to startup onboarding.
              </div>
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
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
              <div>
                <label
                  htmlFor="fullName"
                  style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
              </div>

              <div>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                >
                  Work or Founder Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@startup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
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
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-faint)",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
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
                  style={{ marginTop: "3px" }}
                />
                <label htmlFor="terms" style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                  I agree to the{" "}
                  <Link href="/terms" style={{ color: "var(--brand-forest)", textDecoration: "underline" }}>
                    Terms and Conditions
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
                style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
