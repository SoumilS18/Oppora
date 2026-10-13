"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
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
              <h1 style={{ fontSize: "1.9rem", marginBottom: "0.4rem" }}>
                Reset Password
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Enter your account email to receive a password recovery link.
              </p>
            </div>

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
                  If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password. Please inspect your inbox and spam folder.
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.75rem" }}
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
