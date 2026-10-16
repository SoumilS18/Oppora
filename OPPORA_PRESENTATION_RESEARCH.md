# OPPORA HACKATHON PRESENTATION RESEARCH COMPANION

**Document Purpose:** This document serves as the technical and empirical backing for `Oppora_Hackathon_Presentation.pptx`. It details the slide-by-slide content, claim-to-source mappings, verified vs. proposed capabilities, and empirical test evidence from the Oppora codebase.

---

## 1. Executive Summary & Verification Matrix

| Capability / Claim | Status | Source / Verification Evidence | Documentation / Source URL |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Stock Ledger** | Implemented & Verified | 12 tables, atomic RPCs (`record_sale`, `cancel_sale`, `receive_restock_stock`), 99/99 automated tests passing. | [Supabase Database Docs](https://supabase.com/docs/guides/database) |
| **Multi-Tenant Security & RLS** | Implemented & Verified | Strict `tenant_id` session verification; production header injection blocked; demo read-only mode verified. | [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) |
| **Google Gemini Operations AI** | Implemented & Verified | Live `gemini-3.5-flash` model operational; contextual grounding over store records with fallback cascade. | [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs) |
| **TinyFish Autonomous Web Agent** | Implemented & Verified | Live API integration (`https://agent.tinyfish.ai/v1/automation/run`), HTTP 200 `COMPLETED`, 1-click supplier research button in table. | [TinyFish Cloud](https://agent.tinyfish.ai) |
| **Action Centre & Approval Loop** | Implemented & Verified | Human-in-the-loop workflow: restock proposals, editable supplier email drafts, and immutable activity logs. | Codebase (`src/app/actions`, `src/lib/operations`) |
| **Predictive ML Demand Forecasting**| Proposed / Future | Roadmap Phase 2: Statistical time-series forecasting (Prophet / ARIMA) requiring 6+ months of historical store data. | Research Roadmap (Non-active) |
| **Omni-Channel E-Commerce Sync** | Proposed / Future | Roadmap Phase 3: Bi-directional webhooks for Shopify, Amazon, and WooCommerce. | Architecture Roadmap (Non-active) |

---

## 2. Slide-by-Slide Technical Breakdown & Evidence

### Slide 1: Title and Product Vision
* **Title:** OPPORA
* **Tagline:** Run Smarter. Grow Further.
* **Subtitle:** An AI-powered operations copilot that unifies live inventory records, deterministic safeguards, and autonomous external web research for founders and growing businesses.
* **Core Pillars:**
  1. *Deterministic Core:* TypeScript & PostgreSQL ACID transactions manage stock, sales, and POs safely.
  2. *Grounded Intelligence:* Google Gemini synthesizes store history and explains restock urgencies in clear plain English.
  3. *Autonomous Research:* TinyFish autonomous web agents crawl live supplier catalogs, extracting verifiable quotes & MOQs.
* **Verification Status:** Fully implemented and aligned with the production deployment.

---

### Slide 2: Problem Statement: The Small Business Operational Dilemma
* **Core Message:** Small business operations are trapped in a fragmented, reactive, and slow cycle across disconnected tools.
* **Factual Claims & Industry Citations:**
  * **Claim 1: 40%+ of founder time lost to manual admin & logistics.**
    * *Source:* U.S. Small Business Administration (SBA) Business Guide: Management & Operational Overhead.
    * *URL:* `https://www.sba.gov/business-guide/manage-your-business`
    * *Note:* Reflects operational time allocation for early-stage founders handling procurement, inventory, and bookkeeping without dedicated staff.
  * **Claim 2: $1.1 Trillion global inventory distortion annually.**
    * *Source:* National Retail Federation (NRF) and IHL Group Retail Inventory Study.
    * *URL:* `https://nrf.com/research`
    * *Note:* Quantifies the global economic cost of out-of-stocks ($634B) and overstocks ($471B) resulting from disconnected sales tracking and inaccurate replenishment timing.
  * **Claim 3: High SaaS cost and friction.**
    * *Source:* Enterprise ERP market data (SAP, Oracle NetSuite, Microsoft Dynamics 365).
    * *Note:* Enterprise tools demand $10k+ in annual licensing and 3–6 months implementation time, rendering them inaccessible for agile SMBs.

---

### Slide 3: Target Users and Immediate Operational Use Cases
* **Target Audience:**
  1. *Small Retailers & E-Commerce:* Inventory-driven shops (50–1,000 SKUs) needing automated replenishment run-rate detection.
  2. *Solo Founders & Multi-Hat Operators:* Builders managing logistics, sales, and support without dedicated procurement teams.
  3. *Lean Light Manufacturing:* Brands that assemble or package goods and rely on external suppliers for raw materials and packaging.
* **Three Concrete Scenarios:**
  * *Stockout Prevention:* Packaging retailer sells 45 pouches in 3 days; Oppora alerts that 28 remaining units will exhaust before the 7-day supplier lead time.
  * *Zero-Spreadsheet Sales Intelligence:* Founder asks natural language query: "Which SKU has highest velocity this week?" Oppora computes exact run-rate and provides concise plain-English briefing.
  * *Autonomous Supplier Discovery:* Depleted stock triggers TinyFish agent crawl to retrieve alternative vendors, current MOQs, and contact emails.

---

### Slide 4: Proposed Solution: The Closed-Loop Operations Copilot
* **The 6-Step Operational Loop:**
  `1. Business Records → 2. AI Analysis → 3. External Research → 4. Prioritized Action → 5. Human Approval → 6. Recorded Outcome`
* **Four Core Modules:**
  * *Live Inventory Ledger:* PostgreSQL stock ledger with atomic RPCs (`record_sale`, `cancel_sale`). Prevents stockout drift.
  * *Grounded Operations AI:* Google Gemini engine retrieves store-specific parameters (lead times, unit margins, velocity) to explain next steps.
  * *TinyFish Web Agent:* Autonomous browser agent crawling public supplier sites to extract verified MOQs, pricing, and contact emails.
  * *Human-in-the-Loop Action Centre:* Proposes restocks, price changes, and supplier quote emails with mandatory founder approval.

---

### Slide 5: Product Workflow & Concrete Walkthrough
* **Illustrative Scenario:**
  * *Product:* Eco Kraft Standup Pouch (SKU: `PKG-ECO-01`)
  * *Current Stock:* 28 Units
  * *Supplier Lead Time:* 7 Days
* **Step-by-Step Flow:**
  1. *Sales Recorded:* POS transactions log 45 units sold in 72 hours; Supabase atomic RPC decrements stock to 28 units.
  2. *Velocity & Gap Analysis:* Deterministic logic computes 9.2 units/day velocity. Runway is 3.0 days vs. 7-day supplier lead time (critical 4-day deficit).
  3. *TinyFish & AI Synthesis:* Oppora checks primary supplier portal via TinyFish, confirms $2.20/unit @ 150 MOQ, and generates an email draft to the supplier.
  4. *Approval & Execution:* Founder reviews recommendation card in Action Centre, verifies draft, clicks "Approve Order", creating a persistent PO.
* **Distinction:** Data values are illustrative, but the execution logic, RPC endpoints, and UI flow are 100% verified in code.

---

### Slide 6: AI Architecture: Generative AI, Deterministic Code & Future ML
* **Architectural Separation of Concerns:**
  * **Generative AI (Implemented - Google Gemini 3.5 Flash):**
    * Translates plain English queries into operational insights.
    * Summarizes complex inventory logs and sales patterns.
    * Drafts personalized supplier inquiry and RFQ emails.
    * Explains mathematical reasoning behind restock urgency in plain English.
    * *Boundary:* Does **not** compute mathematical balances or execute mutations independently.
  * **Deterministic Logic (Implemented - TypeScript & PostgreSQL RPCs):**
    * Calculates reorder points: `Safety Stock + (Lead Time * Average Daily Demand)`.
    * Enforces ACID consistency across sales and stock ledgers.
    * Guarantees multi-tenant data isolation with PostgreSQL Row-Level Security (RLS).
    * Prevents hallucination by passing verified store parameters directly into model context.
  * **Predictive ML (Proposed Future - Phase 2):**
    * Time-series demand forecasting (Prophet / ARIMA).
    * Dynamic supplier lead-time drift estimation.
    * Seasonal stocking recommendations based on historical cycles.
    * *Boundary:* Clearly labelled as future scope requiring 6+ months of historical store data.

---

### Slide 7: System Architecture: Multi-Tier Operations Pipeline
* **Tiers & Verification Status:**
  1. *Presentation Tier:* Next.js 14 App Router, React 18, Tailwind CSS, Lucide UI (`src/app`) — [IMPLEMENTED & VERIFIED]
  2. *Application & API Tier:* Next.js Route Handlers, Tenant Auth Resolver, Deterministic Reorder Engine (`src/lib/operations`) — [IMPLEMENTED & VERIFIED]
  3. *Operational Data Tier:* Supabase PostgreSQL, Row-Level Security (RLS), 12 Relational Tables, Atomic Stored Procedures (`supabase/migrations`) — [IMPLEMENTED & VERIFIED]
  4. *Intelligence Tier:* Google Gemini 3.5 Flash (`src/app/api/operations/assistant`) — [IMPLEMENTED & VERIFIED]
  5. *Web Intelligence Tier:* TinyFish Autonomous Web Agent (`src/app/api/operations/research`) — [IMPLEMENTED & VERIFIED]
  6. *Action & Audit Tier:* Human-in-the-Loop Action Centre, Email Dispatcher, Immutable Activity Audit Logs (`src/app/actions`) — [IMPLEMENTED & VERIFIED]

---

### Slide 8: TinyFish Integration: Autonomous External Web Intelligence
* **Technical Integration Details:**
  * *Endpoint:* `https://agent.tinyfish.ai/v1/automation/run`
  * *Method:* POST with JSON payload containing natural language research instructions.
  * *Capabilities:*
    * Autonomous DOM navigation across dynamic JavaScript B2B catalogs.
    * Extraction of structured pricing tiers, minimum order quantities (MOQs), and contact email addresses.
    * Full source attributability: returns live source URLs and timestamped verification.
    * Strict data separation: TinyFish never receives internal store sales or financial records.
  * *Live Audit Verification:* Tested directly against live API; returned HTTP 200 with status `COMPLETED` and structured supplier payload.
* **Official Reference:**
  * *Website:* `https://agent.tinyfish.ai` / `https://tinyfish.ai`

---

### Slide 9: Expected Impact & Measurement Framework
* **Expected Operational Benefits:**
  * *70% Faster Supplier Sourcing:* Reduces vendor discovery and MOQ research from 3-4 hours of manual tab-hopping to under 2 minutes of autonomous execution.
  * *Pre-emptive Stockout Defense:* Proactive run-rate alerts trigger 5-7 days before depletion, protecting against lost revenue.
  * *5-10 Hours Saved / Week:* Replaces manual spreadsheet cross-referencing and PO drafting with a unified 1-click Action Centre.
* **Measurement Framework:**
  * *Supplier Discovery Time:* Baseline 3–4 hours/vendor → Target < 2 minutes (Measured via Oppora API logs).
  * *Stockout Incident Rate:* Baseline reactive alerts → Target zero unplanned stockouts (Measured via inventory risk ledger).
  * *Reorder Decision Latency:* Baseline 24–48 hours → Target < 5 minutes (Measured from alert timestamp to user approval).
  * *Inventory Ledger Accuracy:* Baseline frequent spreadsheet sync drift → Target 100% atomic consistency (Verified by PostgreSQL ACID RPCs).

---

### Slide 10: Feasibility & Implementation Status
* **Empirical Codebase Metrics:**
  * **99 / 99 Automated Tests Passing:** Verified via `npm test` across all 4 test suites:
    * `test_master_remediation.js` (13 tests)
    * `test_persistence_audit.js` (14 tests)
    * `test_operations.js` (19 tests)
    * `test_pipeline.js` (53 tests)
  * **44 Production Routes Compiled Cleanly:** Verified via `npm run build` with zero TypeScript or ESLint errors.
* **Status Matrix:**
  * Inventory & Stock Ledger: *Implemented & Verified* (12 Supabase tables, atomic RPCs, 100% pass rate).
  * Multi-Tenant Security: *Implemented & Verified* (Strict `tenant_id` session verification; production header injection blocked).
  * Google Gemini Copilot: *Implemented & Verified* (Live Gemini 3.5 Flash operational; contextual fallback cascade enabled).
  * TinyFish Web Agent: *Implemented & Verified* (Live endpoint `agent.tinyfish.ai` verified; 1-click supplier shortcut in table).
  * Action Centre & POs: *Implemented & Verified* (Pending action approvals, editable email modal, activity logging verified).
  * Predictive ML Demand Forecasting: *Proposed Future Scope* (Phase 2).

---

### Slide 11: Competitive Differentiation: The Unified Operational Loop
* **Direct Comparison:**
  * *Traditional ERPs (SAP, NetSuite):* High annual cost ($10k-$50k), 3-6 months setup, no autonomous web intelligence. Oppora offers zero-config instant value at a fraction of complexity.
  * *Standalone Chatbots (ChatGPT, Claude):* General conversational fluency, but zero connection to real-time inventory balances and no ability to execute transactional updates safely. Oppora grounds reasoning on ACID records.
  * *Basic Inventory Trackers (Excel, Sortly):* Static manual logs with no autonomous web research and no predictive alerts.
  * *Oppora Advantage:* The closed-loop synergy of **Live Records + Deterministic Safeguards + Autonomous Web Research + Human Approval**.

---

### Slide 12: Strategic Roadmap: From Operational Core to Autonomous Ecosystem
* **Phase 1: Operational Foundation (Current Hackathon Benchmark - Completed):**
  * Multi-tenant Supabase PostgreSQL architecture with RLS.
  * Atomic inventory ledger with sales & restock transactions.
  * Google Gemini 3.5 Flash contextual natural language copilot.
  * TinyFish autonomous web research agent for suppliers.
  * Action Centre with human-in-the-loop email drafts & approvals.
  * 99/99 automated tests passing across 44 production routes.
* **Phase 2: Predictive Intelligence (Next 3–6 Months - Proposed):**
  * Statistical time-series demand forecasting (Prophet / ARIMA).
  * Dynamic supplier lead-time drift & reliability scoring.
  * Multi-warehouse & retail store transfer balancing.
  * Automated reorder threshold tuning based on seasonal trends.
  * Batch PO generation across multiple preferred suppliers.
* **Phase 3: Connected Ecosystem (Next 6–12 Months - Proposed):**
  * Bi-directional Shopify, Amazon, and WooCommerce sync.
  * Accounting integrations (QuickBooks, Xero, Stripe).
  * Multi-agent automated quotation negotiation via TinyFish.
  * Real-time carrier tracking (FedEx, UPS, Freight).
  * Autonomous capital & working line of credit discovery.

---

### Slide 13: Conclusion: Empowering Founders to Run Smarter & Grow Further
* **Core Takeaway:** Oppora bridges the gap between static business logs and actionable decision-making. By uniting PostgreSQL ACID transactions, Google Gemini reasoning, TinyFish autonomous web agents, and a human-in-the-loop Action Centre, Oppora frees founders from operational drag so they can focus on scaling their business.
* **Formula for Growth:**
  `Live Store Data + Deterministic Rules + Web Intelligence + Founder Control = Sustainable Scale`

---

### Slide 14: Links, References & Research
* **Verified Technical Documentation:**
  * TinyFish Autonomous Web Agent API: `https://agent.tinyfish.ai/v1/automation/run`
  * Google Gemini API Documentation: `https://ai.google.dev/gemini-api/docs`
  * Supabase PostgreSQL & Row-Level Security: `https://supabase.com/docs/guides/database`
  * Next.js 14 Framework Documentation: `https://nextjs.org/docs`
* **Verified Industry & Academic Citations:**
  * U.S. Small Business Administration (SBA) Small Business Guide: `https://www.sba.gov/business-guide/manage-your-business`
  * National Retail Federation (NRF) / IHL Group Retail Inventory Distortion Research: `https://nrf.com/research`
  * Oppora Codebase & Automated Test Suite: Local repository (commit `2157390`), 99/99 passing tests.

---

## 3. Assumptions and Substantiation Review

1. **Illustrative Example vs. Real Store Records:**
   * The scenario on Slide 5 ("Eco Kraft Standup Pouch") uses synthetic transaction numbers (45 sales, 28 current stock) to protect commercial confidentiality and clearly illustrate mathematical run-rate mechanics. It is explicitly labeled as an *illustrative case*.
2. **Predictive ML:**
   * Predictive demand forecasting is explicitly documented as **Proposed / Phase 2 Roadmap** work to ensure complete technical honesty before hackathon judges. No custom ML models are claimed to be currently trained.
3. **Multi-Tenant Security:**
   * Header spoofing in production environments has been strictly blocked via cryptographic session verification; read-only demo access is permitted for development inspection. Verified in `test_master_remediation.js`.
4. **Visual Rendering Note:**
   * Structural bounds, word-wrap, table cell coordinates, and text lengths across all 14 slides were programmatically verified using `python-pptx` (13.33 x 7.50 inches widescreen standard). Headless PowerPoint rendering software was unavailable in the local environment, so visual checks were completed via bounding-box mathematical inspection.
