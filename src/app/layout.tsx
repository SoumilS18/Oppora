import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oppora — AI-Powered Startup Opportunity Intelligence",
  description:
    "Better Opportunities. Smarter Moves. Live opportunity discovery, eligibility matching, and application readiness for founders, powered by TinyFish web intelligence.",
  keywords: [
    "startup opportunities",
    "grants",
    "accelerators",
    "incubators",
    "TinyFish",
    "AI startup matching",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
