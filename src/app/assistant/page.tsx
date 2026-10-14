"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  Sparkles,
  Send,
  Database,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Bot,
  User,
  RefreshCw,
  Package,
  TrendingUp,
  Mail,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  sourceType?: "database" | "tinyfish_web" | "synthesis" | "action_needed";
  groundedFacts?: string[];
  externalSources?: Array<{ title: string; url: string }>;
  suggestedAction?: {
    type: string;
    label: string;
    targetRoute: string;
    requiresConfirmation: boolean;
  };
  timestamp: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      content: `Hello! I am your **Oppora Startup Operations Copilot**.

I can answer questions grounded directly in your **live sales and inventory database**, search external public web data via **TinyFish Web Intelligence**, and draft supplier communications.

Try asking:
• *"Which products need restocking right now?"*
• *"Which products sold the most in the past 30 days?"*
• *"What is the estimated gross profit for the business?"*
• *"Which supplier emails need review or approval?"*
• *"Find alternative suppliers for packaging in India"*`,
      sourceType: "database",
      groundedFacts: ["Connected to authenticated operations database"],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!promptToSend) setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/operations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();
      if (res.ok) {
        const assistantMessage: Message = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          content: data.answer,
          sourceType: data.sourceType,
          groundedFacts: data.groundedFacts,
          externalSources: data.externalSources,
          suggestedAction: data.suggestedAction,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errMessage: Message = {
          id: `asst-err-${Date.now()}`,
          sender: "assistant",
          content: `Unable to process request: ${data.error || "Internal error"}`,
          sourceType: "action_needed",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errMessage]);
      }
    } catch {
      const netErr: Message = {
        id: `asst-net-${Date.now()}`,
        sender: "assistant",
        content: "Network error communicating with the assistant service.",
        sourceType: "action_needed",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, netErr]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Which products need restocking?",
    "Which products sold the most this month?",
    "What is the estimated gross profit for the business?",
    "Which supplier emails need approval?",
    "Find suppliers for compostable mailers in India",
  ];

  return (
    <AppShell
      title="AI Operations Copilot"
      subtitle="Navigate internal business records and perform grounded web research with AI"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 180px)",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-subtle)",
        }}
      >
        {/* Chat History Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            backgroundColor: "var(--surface-parchment)",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              {/* Message Bubble Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.25rem",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                }}
              >
                {m.sender === "assistant" ? (
                  <>
                    <Sparkles size={12} color="var(--brand-forest)" />
                    <strong>Oppora Copilot</strong>
                    {m.sourceType && (
                      <span
                        className={`badge ${
                          m.sourceType === "database"
                            ? "badge-forest"
                            : m.sourceType === "tinyfish_web"
                            ? "badge-amber"
                            : "badge-muted"
                        }`}
                        style={{ fontSize: "0.62rem", padding: "0.05rem 0.35rem" }}
                      >
                        {m.sourceType === "database"
                          ? "Database Grounded"
                          : m.sourceType === "tinyfish_web"
                          ? "TinyFish Live Web"
                          : "AI Synthesis"}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <User size={12} />
                    <strong>You</strong>
                  </>
                )}
                <span>&bull; {m.timestamp}</span>
              </div>

              {/* Bubble Body */}
              <div
                style={{
                  maxWidth: "85%",
                  padding: "0.95rem 1.15rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: m.sender === "user" ? "var(--brand-forest)" : "#FFFFFF",
                  color: m.sender === "user" ? "#FFFFFF" : "var(--text-ink)",
                  border: m.sender === "user" ? "none" : "1px solid var(--border-subtle)",
                  boxShadow: m.sender === "user" ? "none" : "var(--shadow-subtle)",
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}

                {/* Grounded Database Facts Badge List */}
                {m.groundedFacts && m.groundedFacts.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.85rem",
                      paddingTop: "0.65rem",
                      borderTop: "1px solid var(--border-subtle)",
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>Grounding Context:</div>
                    <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                      {m.groundedFacts.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* External Web Sources */}
                {m.externalSources && m.externalSources.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.65rem",
                      borderTop: "1px solid var(--border-subtle)",
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>External Sourced Findings:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {m.externalSources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--brand-forest)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <span>{s.title}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Link Button */}
                {m.suggestedAction && (
                  <div style={{ marginTop: "0.85rem" }}>
                    <Link
                      href={m.suggestedAction.targetRoute}
                      className="btn-primary"
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <span>{m.suggestedAction.label}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
              <RefreshCw size={14} className="spin" />
              <span>Oppora Copilot is querying your database and synthesizing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel / Pills */}
        <div
          style={{
            padding: "0.65rem 1rem",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>
            Suggested:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              style={{
                fontSize: "0.75rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--surface-subtle)",
                border: "1px solid var(--border-medium)",
                color: "var(--text-charcoal)",
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: "flex", gap: "0.65rem" }}
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about your inventory, sales, supplier emails, or market research..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.65rem 1rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-medium)",
                fontSize: "0.9rem",
              }}
            />
            <button type="submit" disabled={loading || !inputPrompt.trim()} className="btn-primary" style={{ padding: "0.65rem 1.25rem" }}>
              <Send size={16} />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
