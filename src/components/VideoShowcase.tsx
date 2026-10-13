"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles, ShieldCheck, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";

export function VideoShowcase() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Attempt autoplay
    video.play().then(() => setHasStarted(true)).catch(() => {
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 18px 42px -12px rgba(28, 25, 23, 0.12), 0 0 0 1px rgba(28, 25, 23, 0.05)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Editorial Window Chrome */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.65rem 1.15rem",
          backgroundColor: "var(--surface-parchment-deep)",
          borderBottom: "1px solid var(--border-medium)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        {/* Left: Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <img
            src="/oppora-logo.jpg"
            alt="Oppora Logo"
            width={18}
            height={18}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "4px",
              objectFit: "cover",
              border: "1px solid var(--border-medium)",
              display: "inline-block",
            }}
          />
          <strong
            style={{
              color: "var(--text-ink)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: "0.76rem",
            }}
          >
            Oppora Intelligence Preview
          </strong>
          <span
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              padding: "0.15rem 0.5rem",
              borderRadius: "var(--radius-xs)",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--text-charcoal)",
            }}
          >
            10s Live Overview
          </span>
        </div>

        {/* Center / Right: Interactive Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.76rem",
              fontWeight: 600,
              padding: "0.3rem 0.65rem",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-ink)",
              cursor: "pointer",
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={13} color="var(--brand-forest)" /> Pause
              </>
            ) : (
              <>
                <Play size={13} color="var(--brand-forest)" /> Play
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.76rem",
              fontWeight: 600,
              padding: "0.3rem 0.65rem",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-ink)",
              cursor: "pointer",
            }}
          >
            {isMuted ? (
              <>
                <VolumeX size={13} color="var(--text-muted)" /> Muted
              </>
            ) : (
              <>
                <Volume2 size={13} color="var(--brand-forest)" /> Sound On
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Viewport: Natural 16:9 Widescreen Alignment */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "#1C1917",
          lineHeight: 0,
          cursor: "pointer",
          overflow: "hidden",
        }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src="/oppora-showcase.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Centered Play Overlay when paused */}
        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(28, 25, 23, 0.45)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              gap: "0.6rem",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "var(--brand-forest)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              <Play size={24} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: "3px" }} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.02em" }}>
              Click to Resume Preview
            </span>
          </div>
        )}
      </div>

      {/* Scrubber Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "3px",
          backgroundColor: "var(--border-subtle)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "var(--brand-forest)",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Editorial Caption Bar Beneath Video */}
      <div
        style={{
          padding: "0.85rem 1.15rem",
          backgroundColor: "var(--surface-card)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          alignItems: "center",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--brand-forest-light)",
              border: "1px solid var(--brand-forest-border)",
              color: "var(--brand-forest)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <Sparkles size={15} />
          </div>
          <div>
            <strong style={{ fontSize: "0.86rem", color: "var(--text-ink)", display: "block" }}>
              AI Opportunity Discovery
            </strong>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
              Multimodal web intelligence scraping unindexed ministry portals and incubator grants.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--accent-terracotta-light)",
              border: "1px solid var(--accent-terracotta-border)",
              color: "var(--accent-terracotta)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <ShieldCheck size={15} />
          </div>
          <div>
            <strong style={{ fontSize: "0.86rem", color: "var(--text-ink)", display: "block" }}>
              Calibrated Eligibility
            </strong>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
              Deterministic scoring cross-referencing DPIIT recognition, incorporation age, and state domicile.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Link
            href="/discover"
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "0.55rem 1.15rem", width: "100%", justifyContent: "center" }}
          >
            Try Interactive Discovery
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
