# Oppora — Hackathon Demo Script & Judge Walkthrough (AZINHACK ’26)

**Tagline:** *Better Opportunities. Smarter Moves.*  
**Presenter:** Solo Founder / Engineer  
**Status:** MVP Fully Functional with Verified Benchmark Dataset & Real-Time Disqualification Guardrails  

---

## ⏱️ 1. Elevator Pitch

### A. 30-Second Ultra-Crisp Pitch (Opening)
> *"Oppora is an opportunity intelligence platform for early-stage startup founders. Instead of wasting 15 hours a week searching through fragmented government portals and outdated directories, Oppora uses **TinyFish’s live web intelligence** to discover real grants, accelerators, and fellowships as they are published. It extracts structured eligibility criteria, runs deterministic profile matching with hard disqualification caps, and generates an actionable application readiness checklist with source citations."*

### B. 60-Second Detailed Pitch (Alternative)
> *"Every year, early-stage founders miss out on hundreds of millions of dollars in non-dilutive government grants, elite accelerators, and founder fellowships—not because their startups aren't qualified, but because funding opportunities are scattered across hundreds of fragmented, unindexed government websites and program pages with complex eligibility rules.*
>
> *Oppora solves this with an AI-powered opportunity intelligence platform that turns the live web into a structured, personalized deal pipeline for founders.*
>
> *Oppora doesn't hallucinate plausible-sounding programs. It uses **TinyFish’s real-time Search and Headless Fetch APIs** to discover live funding announcements, extracts grounded eligibility criteria, compares them deterministically against the startup’s profile, enforces hard disqualification caps on geographic, stage, and deadline barriers, and generates an actionable application readiness checklist with source citations."*

---

## 🎬 2. 2-Minute End-to-End Feature Demonstration

### Step 1: The Active Startup Profile & Presets (0:00 – 0:30)
1. **Show the Dashboard**: Point out the clean SaaS interface and the top status indicator:
   - `Engine: TinyFish Live Web` (when `TINYFISH_API_KEY` is configured) or `Benchmark Catalog (Demo)` (when running locally without credentials).
2. **Use the Judge Preset Switcher**:
   - Point to the quick preset bar at the top of the dashboard.
   - Click **"AetherHealth (US / Prototype)"**:
     - *Observation*: Notice the active startup is an edge-AI clinical ultrasound triage team in the United States.
     - *Observation*: Top opportunities immediately re-rank: **NSF America's Seed Fund (SBIR Phase I)** scores **98% (High Fit)** because it accepts US early-stage R&D teams.
     - *Observation*: Notice **European Innovation Council (EIC) Accelerator** is immediately flagged with a red border and capped at **25%**: *"Geographic Ineligibility: Program explicitly requires applicants from EU Member States, which excludes startups based in United States."*
   - Click **"TerraCapture (EU / Early Revenue)"**:
     - *Observation*: In 1 click, the table inverts: EIC Accelerator jumps to **98% (High Fit)**, while US NSF SBIR drops to **5% (Disqualified)** because foreign entities cannot receive US SBIR funds.

### Step 2: Triggering Discovery (0:30 – 1:00)
1. **Explain the Pipeline**:
   - Type a custom topic in the search box (e.g., `AI diagnostics grants 2026`) or click **"Discover with TinyFish"**.
   - Explain what happens on the server:
     1. Oppora sanitizes inputs and constructs a query from the profile.
     2. Calls **TinyFish Search API** (`https://api.search.tinyfish.ai`) with `X-API-Key`.
     3. Bypasses anti-bot barriers and fetches top program URLs via **TinyFish Fetch API** (`https://api.fetch.tinyfish.ai`).
     4. Feeds the rendered Markdown to the grounded extractor to populate the typed `OpportunitySchema`.
     5. Runs the deterministic matching engine to compute relevance scores.
   - Click **"Demo Benchmark"** to show instant zero-credential reliability.

### Step 3: Inspecting Grounded Details & Expiration Checks (1:00 – 1:30)
1. **Open Opportunity Card Details**:
   - Click **"Inspect & Checklist"** on **NSF America's Seed Fund**.
   - Point out the distinct metadata tiers:
     - 📌 **Stated in Source Documentation**: Funding amount (`$275,000 non-dilutive grant`), Application Deadline (`Nov 5, 2026`), Geography (`United States`).
     - 🤖 **Grounded Eligibility Analysis**: Explains confirmed synergy factors (Stage match, Industry match, Geography match) and confidence rating (85%).
     - ⚠️ **Manual Verification**: Flags the SAM.gov Cage Code and 15-page technical R&D requirements.
     - 🔗 **Direct Links**: Click *"Open Official Application Portal"* to show direct routing to `https://seedfund.nsf.gov/apply/project-pitch/`.
2. **Show Deadline Expiration Guard**:
   - Scroll to **MIT Climate & Clean Energy Prize (Past Cycle)**.
   - Show the red **"Expired"** badge and score cap ($\le 15\%$): Oppora detects when a published deadline has passed and prevents founders from applying to closed cycles.

### Step 4: Application Readiness Checklist (1:30 – 2:00)
1. **Interactive Checklist**:
   - In the modal, demonstrate the Application Readiness Checklist:
     - Mandatory items: *Prepare: Project Pitch*, *SAM.gov and SBIR.gov Registrations*.
     - Recommended prep: *Draft Executive Summary*, *Audit Cap Table*.
   - Check off items: Notice the animated progress bar updates in real-time (e.g., to 40%).
2. **Persistence Demonstration**:
   - Refresh the browser page (`F5`).
   - Reopen the NSF card: The progress and completed checklist items persist from `localStorage`.
   - Toggle the bookmark icon on 2 cards and click the **"Saved (2)"** filter to showcase saved opportunity workflows.

---

## 🔌 3. Why TinyFish is Essential to Oppora

- **Bypassing Bot Walls on Grant Portals**: Government funding portals (Grants.gov, NSF, EU Funding Tenders) and accelerator platforms (F6S, Gust, Submittable) utilize aggressive anti-scraping and cloudflare firewalls. Raw HTTP libraries (`axios`, `curl`, `cheerio`) fail or get blocked immediately.
- **Client-Side JavaScript Rendering**: Modern accelerator sites render application requirements inside dynamic React/Vue SPAs. **TinyFish Fetch API** renders JavaScript in headless Chromium and strips navigation noise, ads, and cookie notices, delivering clean Markdown.
- **Live Search Index vs. Stale Databases**: Directories like Crunchbase or AngelList are frequently outdated. **TinyFish Search API** discovers fresh, open RFP calls published this month.

---

## 🛡️ 4. Live API Status & Presentation Fallback

- **Live Endpoint Verification**: Both Search (`https://api.search.tinyfish.ai`) and Fetch (`https://api.fetch.tinyfish.ai`) have been verified with authenticated credentials. Live discovery returned active startup programs (such as Fast Forward Accelerator, NACHC HealthTech, JLABS Incubator) with structured Markdown extraction directly from the live web.
- **To Run Live Discovery with Your API Key**:
  1. Add `TINYFISH_API_KEY=your_key_here` into `Oppora/.env.local`.
  2. Click **"Discover with TinyFish"**. Oppora automatically queries TinyFish Search, extracts top candidate pages via TinyFish Fetch, parses structured fields, and ranks them against the active profile.
- **Fallback During the Live Pitch**:
  If external internet connectivity fails or API rate limits occur during the judging presentation, Oppora automatically catches errors and serves the high-fidelity **Verified Benchmark Mode** so the demonstration never stalls. Click **"Demo Benchmark"** at any time to demonstrate zero-credential reliability.

---

## ⚖️ 5. Honest Technical Limitations & Tested vs. Planned Distinctions

- **Tested vs. Planned Distinctions**:
  - *Fully Tested & Verified*: Next.js 14 dashboard, preset profile switching, TinyFish Search & Fetch pipeline, deterministic matching engine with hard disqualification caps, checklist generator, local state persistence, and 20 automated tests.
  - *Planned Post-Hackathon*: Automated recurring background cron web monitoring, PDF grant document OCR parsing, and AI grant proposal drafting.
- **Headless Page Fetch Latency**: Full JavaScript rendering through TinyFish Fetch takes 3–8 seconds per page. Oppora caps concurrent page fetches to the top 4 candidate URLs to maintain responsive UX.
- **Login-Gated Portals**: Opportunities hidden behind mandatory account sign-ins (e.g. internal university intranets) cannot be accessed by public web agents; Oppora extracts the public announcement snippet and provides the portal link for manual completion.
- **Match Score Definition**: Oppora explicitly reminds founders that match scores are heuristic fit estimates (0–100%) based on accessible source documentation, not statistically calibrated probabilities of winning or legal funding guarantees. Missing information reduces confidence scores rather than assuming a match.

---

## 💬 6. Judge Q&A Cheat Sheet (Likely Questions)

### Q1: "Why use TinyFish instead of standard Cheerio or Puppeteer scraping?"
> **Answer:** *"Grant portals and accelerator sites (Grants.gov, EU Funding Tenders, F6S) deploy aggressive Cloudflare anti-bot barriers and render their applications in client-side SPAs. Raw HTTP tools like Cheerio fail immediately. Running self-hosted Puppeteer clusters requires heavy server infrastructure, proxy rotation, and captcha solving. TinyFish handles headless Chromium rendering, anti-bot bypass, and returns clean Markdown directly via simple REST endpoints, letting Oppora stay serverless and lightweight."*

### Q2: "How do you guarantee data freshness and prevent founders from applying to expired grants?"
> **Answer:** *"Oppora uses a two-pronged freshness engine. First, TinyFish Search queries only live indexed pages published for current RFP cycles (e.g., 2026). Second, our date parser distinguishes specific deadlines, rolling admissions, and unstated dates. If a deadline has passed, Oppora flags it with an explicit red 'Expired' badge and enforces a hard disqualification score cap (score $\le 15\%$), preventing founders from wasting effort on closed programs."*

### Q3: "Is the match score a probability of winning funding?"
> **Answer:** *"No, and we are very clear about that in the UI. The score is a heuristic relevance estimate (0–100%) evaluating baseline eligibility: geography, development stage, entity type, and domain focus. It also enforces hard disqualification caps: if an applicant is geographically ineligible (e.g., US startup on European EIC), the score is capped at 25% with an explicit conflict warning. Missing source details lower the confidence rating rather than being treated as positive matches."*

### Q4: "How is founder profile data protected?"
> **Answer:** *"Oppora does not require or store sensitive proprietary IP, equity cap tables, or pitch deck files. Profile matching is performed server-side or in-memory, and user state (checklists and bookmarks) is persisted locally in the founder's browser (`localStorage`). Oppora does not train models on founder profiles or sell application data."*

### Q5: "What is your monetization plan after the hackathon?"
> **Answer:** *"We propose a freemium model. The core search, eligibility scoring, and checklist generator remain free for solo founders. A Pro tier ($29/month) would offer continuous automated web monitoring with email alerts when newly published RFPs match their profile. For incubators and universities, an institutional license ($199/month) would provide a portfolio dashboard tracking grant deadlines across all cohort startups."*

---

## ✅ 7. Final Pre-Submission Checklist

- [x] **Production Build Verified**: Next.js 14 production build (`npm run build`) compiles with zero errors or warnings.
- [x] **Comprehensive Test Suite**: All 20 automated tests in `test_pipeline.js` pass with 0 failures (`npm test`).
- [x] **Live TinyFish Integration Verified**: Authenticated Search and Fetch requests tested and verified against official endpoints.
- [x] **Zero-Credential Demo Mode**: App runs deterministically and safely even without an API key.
- [x] **Disqualification Hard Caps**: Geographic ineligibility capped at $\le 25\%$; expired deadlines capped at $\le 15\%$; stage barriers capped at $\le 25\%$.
- [x] **SSRF Protections Enforced**: Blocks private IPs, loopback, CGNAT, documentation nets, IPv6 unique local, and metadata endpoints (including on redirect `final_url`).
- [x] **Security Freeze**: All credentials isolated server-side. No secrets in client bundles, responses, logs, or Git history.
- [x] **Checklist & Bookmark Persistence**: Interactive application checklist progress and saved bookmarks persist across browser reloads via `localStorage`.
- [x] **Vercel & Next.js Deployment Ready**: Clean scripts, `.env.example`, `.gitignore`, and documentation.

