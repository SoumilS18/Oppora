"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { Eye, EyeOff, ArrowRight, AlertCircle, Info, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isConfigured } = getSupabaseConfig();

  // Check for error or message parameters passed via redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // If already logged in, check session on load
  useEffect(() => {
    if (!isConfigured) return;
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const rawNext = searchParams.get("next");
          const destination =
            rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
              ? rawNext
              : "/workspace";
          router.replace(destination);
        }
      });
    } catch {}
  }, [isConfigured, searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid account email address.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    if (!isConfigured) {
      setError(
        "Supabase credentials are not configured in your environment. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable real database authentication."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
          setError("Invalid email address or password. Please verify your credentials and try again.");
        } else if (msg.includes("email not confirmed")) {
          setError(
            "Your email address has not been confirmed yet. Please inspect your inbox for the verification link sent during registration."
          );
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        const rawNext = searchParams.get("next");
        // Strict open-redirect defense: must start with / and not //
        const destination =
          rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
            ? rawNext
            : "/workspace";

        router.push(destination);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to authenticate with the service. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          Welcome Back
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Sign in to access your opportunity pipeline and persistent workspace.
        </p>
      </div>

      {/* Supabase Status Banner (Truthful disclosure when unconfigured) */}
      {!isConfigured && (
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
            <strong>Configuration Required:</strong> Supabase credentials are not yet set in <code>.env.local</code>. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable live database authentication. See <code>SUPABASE_SETUP.md</code> for instructions.
          </div>
        </div>
      )}

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
            htmlFor="email"
            style={{
              display: "block",
              fontSize: "0.84rem",
              fontWeight: 600,
              marginBottom: "0.35rem",
              color: "var(--text-ink)",
            }}
          >
            Email Address
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.35rem",
            }}
          >
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
              autoComplete="current-password"
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

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="remember" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Remember session cookies on this device
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem", justifyContent: "center" }}
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
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "4rem 0 5rem 0", backgroundColor: "var(--surface-parchment)" }}>
        <div className="container-narrow" style={{ maxWidth: "440px" }}>
          <Suspense fallback={<div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
