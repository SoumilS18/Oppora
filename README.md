# Oppora 🚀
### Better Opportunities. Smarter Moves.
**AI-Powered Startup Opportunity Intelligence Platform for AZINHACK ’26**

Oppora is an intelligent opportunity platform designed for startup founders. Instead of searching fragmented portals and outdated directories, founders use Oppora to discover real grants, accelerators, competitions, and fellowships from the live web, evaluate eligibility with grounded matching, and generate actionable application readiness checklists.

---

## 🌟 Core Features

1. **🌐 Web Intelligence via TinyFish Search & Fetch APIs**
   - **TinyFish Search API** (`https://api.search.tinyfish.ai`): Discovers fresh grant calls, accelerators, competitions, and funding programs across the live web.
   - **TinyFish Fetch API** (`https://api.fetch.tinyfish.ai`): Headless Chromium extraction bypassing anti-bot walls to extract clean, structured Markdown from opportunity pages.
   - **Source Grounding**: Every opportunity retains its primary source URL and retrieval timestamp. Factual fields (amounts, deadlines, requirements) are grounded in source content and never invented.

2. **🎯 Grounded Eligibility Matching & Disqualification Safeguards**
   - Compares the startup profile (industry, stage, country, organization type) against parsed opportunity criteria.
   - Computes an **Estimated Relevance Score (0–100%)** with calibrated tiers (*High Fit*, *Moderate Fit*, *Low Fit*, *Disqualified / Low Fit*).
   - **Disqualification Hard Caps**: Enforces strict caps (score $\le 25\%$) when disqualifying conditions exist (e.g. geographic ineligibility, expired deadlines, incompatible stage barriers).
   - **Confidence Scoring**: Adjusts confidence ratings when program disclosures are incomplete.

3. **📅 Deadline Intelligence & Expiration Detection**
   - Differentiates specific calendar deadlines, rolling reviews, and unstated deadlines.
   - Automatically detects and flags expired opportunities with a dedicated indicator.

4. **📋 Application Readiness Assistant & State Persistence**
   - Generates categorized checklists for any selected opportunity:
     - **Provider Requirements** (mandatory submission assets)
     - **Manual Verifications** (verifying timezone cutoffs, legal entity status)
     - **Preparation Steps** (pitch deck tailoring, cap table audits)
   - Tracks completion progress with persistence in `localStorage`, plus bulk "Mark all done" and "Reset" actions.

5. **⚡ Truthful Live vs. Demo Signaling**
   - If `TINYFISH_API_KEY` is not configured or in Demo Mode, Oppora activates verified real-world benchmark data (NSF SBIR Phase I, Y Combinator, EIC Accelerator, Google for Startups AI, Thiel Fellowship, Techstars Anywhere).
   - All benchmark data is explicitly labeled **"Demo Benchmark"** and never misrepresented as live scrapes.

6. **🎛️ Judge Preset Switcher**
   - Instantly switch between 3 diverse benchmark startup profiles (US HealthTech, EU CleanTech, Student AI Founder) to test eligibility and geographic disqualification dynamics in 1 click.

---

## 🏗️ Architecture & Verified Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailored Vanilla CSS Design System with dark glassmorphic cards, responsive grid, and micro-animations
- **Data Validation**: Zod (`UserProfileSchema`, `OpportunitySchema`)
- **Web Intelligence**: TinyFish Search & Fetch APIs
- **Icons**: Lucide React

```
Oppora/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── discover/route.ts      # Server-side TinyFish Search + Fetch + Matching pipeline
│   │   │   └── health/route.ts        # Health check and configuration status
│   │   ├── globals.css                # CSS design tokens & glassmorphism
│   │   ├── layout.tsx                 # HTML5 metadata & responsive layout
│   │   └── page.tsx                   # Main Oppora Intelligence Dashboard & Checklist drawer
│   ├── lib/
│   │   ├── checklistGenerator.ts      # Application readiness checklist generator
│   │   ├── matchingEngine.ts          # Deterministic, grounded eligibility matching & conflict engine
│   │   ├── mockData.ts                # Verified benchmark opportunities & default profile
│   │   └── tinyfish.ts                # TinyFish Search & Fetch API client with timeouts & error handling
│   └── types/
│       └── opportunity.ts             # TypeScript interfaces & Zod validation schema
├── DEMO_SCRIPT.md                     # Hackathon presentation & judge walkthrough script
├── test_pipeline.js                   # Automated test verification suite
├── .env.example                       # Environment variable template
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 🔌 Verified TinyFish Endpoints

Both endpoints require the `X-API-Key` HTTP header. Both endpoints have been tested and verified against the live TinyFish network:

1. **TinyFish Search API**:
   - `GET https://api.search.tinyfish.ai?query={query}&location=US&purpose={purpose}`
   - Header: `X-API-Key: $TINYFISH_API_KEY`
   - Verified Live Response: Returns HTTP 200 with structured discovery items (`position`, `site_name`, `title`, `snippet`, `url`).
   - Verified Error Response (unauthenticated): Returns HTTP 401 with `{"error":{"code":"MISSING_API_KEY","message":"X-API-Key header is required"}}`.

2. **TinyFish Fetch API**:
   - `POST https://api.fetch.tinyfish.ai`
   - Header: `X-API-Key: $TINYFISH_API_KEY`, `Content-Type: application/json`
   - Body: `{ "urls": [...], "format": "markdown", "purpose": "...", "links": true }`
   - Verified Live Response: Returns HTTP 200 with headless Chromium rendered Markdown (`url`, `final_url`, `title`, `text`, `links`, `latency_ms`).
   - SSRF Protection: Verified on both original URL and redirected `final_url` to prevent intranet/cloud-metadata access.

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- Node.js 18+ (tested on Node.js v24 LTS)
- npm

### 2. Installation
```bash
git clone <repo-url>
cd Oppora

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your credentials in `.env.local`:
```env
TINYFISH_API_KEY=your_tinyfish_api_key_here
```
*(If omitted, Oppora automatically and safely runs in Demo Benchmark mode).*

### 4. Running the Automated Verification Suite
Oppora includes an automated 20-test suite verifying API endpoints, Zod schemas, SSRF defenses, mock upstream failure paths (401/429/500/timeout), URL deduplication, and matching engine disqualification bounds:
```bash
npm test
# Or: node test_pipeline.js
```

### 5. Running the Application Locally
```bash
# Development mode
npm run dev

# Or production build & start
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment (Vercel)

Oppora is production-ready for deployment on Vercel:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. Framework Preset: **Next.js**.
4. Root Directory: `./` (or the folder containing `package.json`).
5. In **Environment Variables**, add:
   - `TINYFISH_API_KEY` = your TinyFish API key (from [tinyfish.ai](https://tinyfish.ai))
   - `OPPORA_DEFAULT_MODE` = `live` (or leave default)
6. Click **Deploy**. Vercel will run `npm run build` and launch Oppora with global edge performance.

---

## 🎬 Hackathon Demonstration

For the complete 2-minute judge walkthrough, see [DEMO_SCRIPT.md](file:///c:/Users/soumi/OneDrive/Desktop/Soumil/College/hackathons/OPPORA/Oppora/DEMO_SCRIPT.md).
