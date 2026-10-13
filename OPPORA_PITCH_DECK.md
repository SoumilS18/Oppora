# Oppora — Pitch Deck (AZINHACK ’26)

**Tagline:** *Better Opportunities. Smarter Moves.*  
**Track:** Web Intelligence & AI Agents  
**Format:** 8-Slide Hackathon Presentation Deck  
**Editable Presentation File:** [`OPPORA_PITCH_DECK.pptx`](file:///c:/Users/soumi/OneDrive/Desktop/Soumil/College/hackathons/OPPORA/Oppora/OPPORA_PITCH_DECK.pptx)

---

## Slide 1: Title & Vision
- **Header:** AZINHACK ’26 Submission • Track: Web Intelligence & AI Agents
- **Title:** Oppora
- **Subtitle:** Better Opportunities. Smarter Moves.
- **Description:** An AI-powered startup opportunity intelligence platform that continuously discovers non-dilutive grants, accelerators, and fellowships from the live web using TinyFish, evaluates deterministic eligibility, and generates actionable application readiness checklists.
- **Presenter:** Solo Founder & Full-Stack Engineer
- **Tech Stack:** Next.js 14, TypeScript, TinyFish Search & Fetch APIs, Zod, Vanilla CSS Design System

---

## Slide 2: The Problem: Founders Are Locked Out by Fragmented Web Data
- **Category:** Market Friction & Pain Points
- **Point 1 — Fragmented Portals:**
  - Government funding programs (NSF SBIR, Horizon Europe EIC), university prize competitions, and private accelerators publish open calls across hundreds of unlinked portals with aggressive anti-scraping walls.
  - Founders waste 15+ hours weekly manually searching directories and search engines instead of building product.
- **Point 2 — Disqualification Traps:**
  - Crucial disqualifiers are buried deep inside 40-page PDF guidelines: strict domestic incorporation rules, stage ceilings (TRL limitations), or unstated legal structures.
  - Founders discover ineligibility only after wasting weeks drafting complex technical proposals.
- **Point 3 — Stale Static Directories:**
  - Existing funding aggregators rely on manual curation, resulting in expired cycles, broken portal links, and unverified grant amounts.
  - Founders need live web verification, confirmed source links, and clear distinction between open and expired cycles.

---

## Slide 3: The Oppora Solution: Grounded Deal Pipeline for Startup Funding
- **Category:** Intelligence Workflow
- **Step 1 — Startup Profile:**
  - Founder defines industry, development stage, country/region, entity structure, and keywords. (1-click judge presets for US HealthTech, EU CleanTech, Student AI).
- **Step 2 — Live Web Discovery:**
  - TinyFish Search & Fetch APIs scour the live web, bypassing bot firewalls and rendering client-side JavaScript into clean, structured Markdown.
- **Step 3 — Deterministic Eligibility Engine:**
  - Deterministic evaluation computes a 0–100% heuristic fit score. Hard caps ($\le 25\%$) isolate geographic mismatches, stage barriers, and expired deadlines ($\le 15\%$).
- **Step 4 — Action Readiness Checklist:**
  - Generates an interactive application readiness checklist with mandatory portal requirements, manual verification flags, and local state persistence.

---

## Slide 4: System Architecture: Proven Live Web & Deterministic Logic
- **Category:** Under The Hood & System Architecture
- **Left Column — TinyFish Live Web Intelligence:**
  - **TinyFish Search API (`GET`):** Discovers live RFP announcements, grants, and accelerator calls using targeted search queries.
  - **TinyFish Fetch API (`POST`):** Headless Chromium extraction rendering client-side JavaScript into structured Markdown (extracts up to 36k characters of content).
  - **Source Grounding:** Every opportunity retains its official source URL, application portal, and retrieval timestamp.
  - **SSRF & Security Shield:** Server-side verification strictly blocks loopback, private RFC 1918 subnets, cloud metadata (`169.254.169.254`), and redirects.
- **Right Column — Deterministic Evaluation Engine:**
  - **Heuristic Fit Scoring (5% – 98%):** Evaluates geography, development stage, entity structure, and keywords. (Never promises winning odds).
  - **Hard Disqualification Caps:** Immediate score caps on geographic barriers (e.g. US startup on European EIC capped at 25%) and expired deadlines (capped at 15%).
  - **Confidence Penalty:** Incomplete source disclosures lower certainty ratings instead of assuming a match.
  - **Readiness Checklist:** Generates categorized submission items, tracks completion percentage, and persists state in `localStorage`.

---

## Slide 5: Product Walkthrough: Grounded Dashboard & Action Drawer
- **Category:** Product Demonstration
- **Opportunity Cards Architecture:**
  - **High Fit Example (98% Relevance):**
    - *Program:* NSF America's Seed Fund (SBIR Phase I)
    - *Benefits:* $275,000 non-dilutive grant
    - *Stated Deadline:* Nov 5, 2026 (Open, specific)
    - *Eligibility Synergy:* Confirmed US-incorporated R&D small business, prototype stage match, deeptech domain synergy.
  - **Hard Disqualification Example (Capped at 25%):**
    - *Program:* European Innovation Council (EIC) Accelerator
    - *Benefits:* €2.5M grant + €15M equity
    - *Disqualification Flag:* Geographic ineligibility explicitly detected (US startup ineligible for EU Member States program).
    - *Founder Value:* Saves 30+ hours of wasted proposal drafting.
- **Inspection & Action Readiness Drawer:**
  - *Stated Source Documentation:* Direct links to official application portal + primary source.
  - *Grounded Match Breakdown:* Detailed evidence reasons, potential conflicts, and confidence score.
  - *Categorized Application Checklist:*
    1. Provider Requirements (Project Pitch, Technical Proposal)
    2. Manual Verifications (SAM.gov Cage Code registration)
    3. Recommended Prep (Executive Summary, IP strategy audit)
  - *Dynamic Persistence:* Progress updates live and persists across browser refreshes via `localStorage`.

---

## Slide 6: Differentiation & Defensibility: Why Oppora Delivers Verifiable Trust
- **Category:** Core Advantages
- **Advantage 1 — Source-Linked Truth (Never Hallucinates Programs):**
  - Oppora does not invent grants or deadlines. Every record is grounded in live web pages fetched via TinyFish or verified benchmark fixtures with active official links.
- **Advantage 2 — Honest Heuristic Fit (Explicit Disqualification Caps):**
  - Match scores are heuristic fit estimates (0–100%), not fake winning probabilities. Ineligibilities and expired deadlines are strictly capped and visually flagged.
- **Advantage 3 — Live vs. Benchmark Transparency (Zero-Credential Reliability):**
  - Transparently distinguishes live discoveries from benchmark catalogs. Works flawlessly whether connected to live TinyFish APIs or in offline demo mode.

---

## Slide 7: Proposed Business Model & Technical Roadmap
- **Category:** Growth Plan (Proposed)
- **Proposed Business Model (Plans for Post-Hackathon):**
  - **Free Founder Tier (Core MVP):** Unlimited opportunity searches, heuristic eligibility matching, and basic application checklists.
  - **Pro Founder Tier ($29/mo proposed):** Continuous automated web monitoring, instant email alerts when new eligible RFPs drop, and multi-country tax credit synthesis.
  - **Incubator / Accelerator License ($199/mo proposed):** Portfolio dashboard tracking opportunity deadlines across 20+ cohort ventures simultaneously.
- **Product Roadmap (Planned Execution Horizon):**
  - **Phase 1 (Today - AZINHACK '26):** Production-ready Next.js MVP, live TinyFish Search & Fetch pipeline, 20 automated tests, and benchmark fallback.
  - **Phase 2 (Q2 2026):** Automated recurring cron monitoring for new government solicitations; PDF grant guidelines parser.
  - **Phase 3 (Q3 2026):** AI Grant Writing Assistant synthesizing first-draft project pitches grounded in founder's profile.

---

## Slide 8: Closing & Value Summary
- **Category:** AZINHACK ’26 Submission Summary
- **Title:** Oppora
- **Tagline:** Better Opportunities. Smarter Moves.
- **Verification Highlights:**
  - **Production Build:** Passing cleanly (Next.js 14, 0 errors or warnings).
  - **Test Suite:** 20 automated tests passed (100% deterministic & offline-safe).
  - **Live Web Intelligence:** TinyFish Search & Fetch verified on live grant portals.
  - **Demo Reliability:** Zero-credential benchmark mode guarantees pitch stability.
  - **Deployment:** [Pending User Permission / Vercel Ready: `https://oppora.vercel.app` (Placeholder)].
- **Closing:** Thank you! Ready for Judge Q&A and Live Demo.
