"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff, ArrowRight, AlertCircle, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    // Client-side demonstration session initialization
    setTimeout(() => {
      setIsLoading(false);
      router.push("/discover");
    }, 400);
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
                Welcome Back
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Sign in to access your opportunity pipeline.
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
                <strong>Hackathon Demo Mode:</strong> Cloud authentication provider is disconnected. Submitting this form enters your session and routes directly to discovery.
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
                  htmlFor="email"
                  style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-ink)" }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="founder@company.com"
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label
                    htmlFor="password"
                    style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-ink)" }}
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: "0.78rem", color: "var(--brand-forest)", textDecoration: "underline" }}
                  >
                    Forgot password?
                  </Link>
                </div>
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

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Remember my session on this device
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
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
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "var(--brand-forest)", fontWeight: 600 }}>
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
