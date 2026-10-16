"""
Oppora Hackathon Presentation Generator - Theme 2: True Neo-Brutalist
Generates a complete, technically rigorous 14-slide PowerPoint deck
in 16:9 widescreen format using authentic Neo-Brutalist design:
- Bone White / Alabaster canvas (#F6F6F8)
- Stark Pitch Black ink (#0C0D0E)
- Hard 2.5pt black borders with solid offset drop shadows (3D Pop)
- High-energy accents: Cyber Lime (#D4F932), Electric Emerald (#10B981), Canary Yellow (#FACC15), Punchy Coral (#EF4444), Ice Cyan (#38BDF8)
- Bold badge tags, typographic hierarchy, clean data tables, process flowcards
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank layout

    # Color Palette: True Neo-Brutalist
    CANVAS_BG = RGBColor(246, 246, 248)     # Bone White #F6F6F8
    INK_BLACK = RGBColor(12, 13, 14)        # Deep Charcoal Black #0C0D0E
    SOLID_BLACK = RGBColor(0, 0, 0)         # Pitch Black for borders & shadows
    CARD_WHITE = RGBColor(255, 255, 255)    # Crisp Pure White
    
    # Neo-Brutalist Signature Pops
    CYBER_LIME = RGBColor(212, 249, 50)     # Neon Cyber Lime #D4F932
    MINT_EMERALD = RGBColor(16, 185, 129)   # Electric Emerald #10B981
    MINT_LIGHT = RGBColor(167, 243, 208)    # Pastel Mint #A7F3D0
    CANARY_YELLOW = RGBColor(250, 204, 21)  # Vivid Canary #FACC15
    CANARY_LIGHT = RGBColor(254, 240, 138)  # Pastel Yellow #FEF08A
    CORAL_ALERT = RGBColor(239, 68, 68)     # Crimson / Coral #EF4444
    CORAL_LIGHT = RGBColor(254, 205, 211)   # Pastel Pink/Coral #FECDD3
    ICE_CYAN = RGBColor(56, 189, 248)       # Vivid Cyan #38BDF8
    ICE_LIGHT = RGBColor(186, 230, 253)     # Pastel Sky Cyan #BAE6FD
    LAVENDER_LIGHT = RGBColor(233, 213, 255)# Soft Purple #E9D5FF
    
    TEXT_MUTED = RGBColor(71, 85, 105)      # Slate 600 #475569
    TEXT_SUBTLE = RGBColor(100, 116, 139)   # Slate 500 #64748B

    def apply_canvas(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = CANVAS_BG
        bg.line.fill.background()
        return bg

    def add_neo_box(slide, left, top, width, height, bg_color=CARD_WHITE, shadow_offset=0.06, border_width=2.5):
        # 1. Solid Black Hard Shadow
        if shadow_offset > 0:
            shadow = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 
                                            left + Inches(shadow_offset), 
                                            top + Inches(shadow_offset), 
                                            width, height)
            shadow.fill.solid()
            shadow.fill.fore_color.rgb = SOLID_BLACK
            shadow.line.fill.background()
            
        # 2. Main Box with crisp black border
        box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
        box.fill.solid()
        box.fill.fore_color.rgb = bg_color
        box.line.color.rgb = SOLID_BLACK
        box.line.width = Pt(border_width)
        return box

    def add_badge(slide, left, top, width, height, text, bg_color=CYBER_LIME, font_size=10, text_color=INK_BLACK):
        add_neo_box(slide, left, top, width, height, bg_color=bg_color, shadow_offset=0.04, border_width=2.0)
        tb = slide.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = text
        p.font.size = Pt(font_size)
        p.font.bold = True
        p.font.color.rgb = text_color
        p.font.name = "Arial Black"

    def add_header(slide, title_text, category_badge="OPPORA SYSTEM", slide_num="", badge_color=CYBER_LIME):
        # Category Badge Box
        add_badge(slide, Inches(0.8), Inches(0.38), Inches(2.8), Inches(0.38), category_badge.upper(), bg_color=badge_color, font_size=10)

        # Slide Number Badge (Top Right)
        if slide_num:
            add_badge(slide, Inches(11.45), Inches(0.38), Inches(1.08), Inches(0.38), f"{slide_num}/14", bg_color=CANARY_LIGHT, font_size=10)

        # Main Title (Bold Heavy)
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.733), Inches(0.65))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(23)
        p.font.bold = True
        p.font.color.rgb = INK_BLACK
        p.font.name = "Arial Black"

        # Hard Neo-Brutalist Underline Rule
        rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.58), Inches(11.733), Inches(0.04))
        rule.fill.solid()
        rule.fill.fore_color.rgb = SOLID_BLACK
        rule.line.fill.background()

    # =========================================================================
    # SLIDE 1: Title and Product Vision
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_canvas(s1)

    # Top Brand Pill
    add_badge(s1, Inches(0.8), Inches(0.65), Inches(3.6), Inches(0.42), "HACKATHON DECK // 2026", bg_color=CYBER_LIME, font_size=11)

    # Giant Neo-Brutalist Hero Card
    hero_card = add_neo_box(s1, Inches(0.8), Inches(1.25), Inches(11.733), Inches(2.75), bg_color=CARD_WHITE, shadow_offset=0.10, border_width=3.5)
    
    tb1_hero = s1.shapes.add_textbox(Inches(1.1), Inches(1.4), Inches(11.1), Inches(2.4))
    tf1_hero = tb1_hero.text_frame
    tf1_hero.word_wrap = True

    p_opp = tf1_hero.paragraphs[0]
    p_opp.text = "OPPORA"
    p_opp.font.size = Pt(58)
    p_opp.font.bold = True
    p_opp.font.color.rgb = INK_BLACK
    p_opp.font.name = "Arial Black"

    p_tag = tf1_hero.add_paragraph()
    p_tag.text = "RUN SMARTER. GROW FURTHER."
    p_tag.font.size = Pt(22)
    p_tag.font.bold = True
    p_tag.font.color.rgb = MINT_EMERALD
    p_tag.font.name = "Arial Black"

    p_desc = tf1_hero.add_paragraph()
    p_desc.text = "The AI-Powered Operations Copilot for Startups & Small Businesses.\nUnifying live inventory records, deterministic safeguards, and autonomous external web research."
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = TEXT_MUTED
    p_desc.font.name = "Arial"

    # 3 Neo-Brutalist Feature Cards across bottom
    pillars = [
        ("DETERMINISTIC CORE", CANARY_LIGHT, 
         "PostgreSQL ACID ledger and TypeScript operations engine govern stock quantities, margins, and purchase orders safely.", 
         "TECH: SUPABASE RPCs"),
        ("GROUNDED AI INTELLIGENCE", MINT_LIGHT, 
         "Google Gemini 3.5 Flash synthesizes store records and explains restocking urgencies in plain English without hallucination.", 
         "TECH: GEMINI 3.5 FLASH"),
        ("AUTONOMOUS WEB RESEARCH", ICE_LIGHT, 
         "TinyFish browser agent traverses live supplier portals, extracting verified pricing tiers, contact info, and MOQs.", 
         "TECH: TINYFISH AGENT")
    ]

    for i, (p_title, p_bg, p_text, p_tag_sub) in enumerate(pillars):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(4.35)
        c_w = Inches(3.733)
        c_h = Inches(2.55)

        add_neo_box(s1, c_left, c_top, c_w, c_h, bg_color=p_bg, shadow_offset=0.08, border_width=3.0)

        tb = s1.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.2), c_w - Inches(0.4), c_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = INK_BLACK
        p1.font.name = "Arial Black"

        p2 = tf.add_paragraph()
        p2.text = f"\n{p_text}\n"
        p2.font.size = Pt(11)
        p2.font.color.rgb = INK_BLACK
        p2.font.name = "Arial"

        p3 = tf.add_paragraph()
        p3.text = f"[{p_tag_sub}]"
        p3.font.size = Pt(9)
        p3.font.bold = True
        p3.font.color.rgb = SOLID_BLACK
        p3.font.name = "Consolas"

    # =========================================================================
    # SLIDE 2: Problem Statement
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_canvas(s2)
    add_header(s2, "THE SMALL BUSINESS OPERATIONAL DILEMMA", "PROBLEM STATEMENT", "02", badge_color=CORAL_LIGHT)

    # Left: The Operational Trap (Card with Coral Accents)
    add_neo_box(s2, Inches(0.8), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
    
    # Header tab inside card
    add_badge(s2, Inches(1.0), Inches(2.05), Inches(3.6), Inches(0.38), "THE FRAGMENTATION TRAP", bg_color=CORAL_LIGHT, font_size=10)

    tb2_l = s2.shapes.add_textbox(Inches(1.0), Inches(2.55), Inches(5.25), Inches(4.15))
    tf2_l = tb2_l.text_frame
    tf2_l.word_wrap = True

    trap_items = [
        ("SCATTERED DATA SILOS", "Inventory, sales logs, and supplier chats live across disconnected spreadsheets, paper notes, and WhatsApp threads."),
        ("STOCKOUTS CAUGHT TOO LATE", "Retailers realize their flagship product is depleted only after a paying customer order fails—sacrificing immediate revenue."),
        ("MANUAL SUPPLIER HUNTING", "Finding alternative vendors, comparing MOQs, and tracking lead times takes 4-8 hours of manual browser tab hopping."),
        ("DISCONNECTED EXECUTION", "Insights don't trigger workflows: founders still manually copy-paste SKUs into raw email clients.")
    ]
    for idx, (head, desc) in enumerate(trap_items):
        p_h = tf2_l.add_paragraph() if idx > 0 else tf2_l.paragraphs[0]
        p_h.text = f"[X] {head}"
        p_h.font.size = Pt(11)
        p_h.font.bold = True
        p_h.font.color.rgb = CORAL_ALERT
        p_h.font.name = "Arial Black"

        p_d = tf2_l.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = INK_BLACK
        p_d.font.name = "Arial"

    # Right: Measurable Industry Costs (Yellow / High Alert)
    add_neo_box(s2, Inches(6.88), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=CANARY_LIGHT, shadow_offset=0.08, border_width=3.0)
    add_badge(s2, Inches(7.1), Inches(2.05), Inches(3.8), Inches(0.38), "QUANTIFIED INDUSTRY FRICTION", bg_color=CARD_WHITE, font_size=10)

    tb2_r = s2.shapes.add_textbox(Inches(7.1), Inches(2.55), Inches(5.25), Inches(4.15))
    tf2_r = tb2_r.text_frame
    tf2_r.word_wrap = True

    cost_items = [
        ("40%+ FOUNDER TIME IN ADMIN", "U.S. SBA reports early-stage operators spend over one-third of their working week on repetitive manual logistics rather than marketing and revenue generation."),
        ("$1.1 TRILLION INVENTORY LOSS", "National Retail Federation (NRF) and IHL research shows out-of-stocks and overstocks cost global retailers $1.1T annually due to inaccurate run-rate awareness."),
        ("HIGH SAAS BARRIERS & COST", "Enterprise ERPs (SAP, NetSuite) cost $10k+ with months of setup, while generic chatbots lack access to atomic database ledgers.")
    ]
    for idx, (head, desc) in enumerate(cost_items):
        p_h = tf2_r.add_paragraph() if idx > 0 else tf2_r.paragraphs[0]
        p_h.text = f"[!] {head}"
        p_h.font.size = Pt(11)
        p_h.font.bold = True
        p_h.font.color.rgb = INK_BLACK
        p_h.font.name = "Arial Black"

        p_d = tf2_r.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(10)
        p_d.font.color.rgb = INK_BLACK
        p_d.font.name = "Arial"

    # =========================================================================
    # SLIDE 3: Target Users and Realistic Use Cases
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_canvas(s3)
    add_header(s3, "TARGET USERS & IMMEDIATE OPERATIONAL USE CASES", "TARGET AUDIENCE", "03", badge_color=CYBER_LIME)

    audiences = [
        ("SMALL RETAILERS", ICE_LIGHT,
         "Inventory-driven shops (apparel, packaging, specialty food) with 50-1,000 SKUs needing automated replenishment thresholds.",
         "USE CASE: STOCKOUT PREVENTION",
         "A packaging brand sells 45 pouches over 3 days. Oppora detects that remaining 28 units will exhaust before the 7-day supplier lead time, flagging an urgent restock recommendation."),
        ("SOLO FOUNDERS", MINT_LIGHT,
         "Early-stage builders managing logistics, sales, marketing, and support without dedicated procurement or analytics staff.",
         "USE CASE: ZERO-SPREADSHEET SALES",
         "A founder asks: 'Which SKU has highest velocity this week?' Oppora calculates exact run-rates from PostgreSQL transactions and provides a plain-English briefing in 3 seconds."),
        ("LIGHT MANUFACTURERS", CANARY_LIGHT,
         "Teams that assemble or package goods and rely on external suppliers for raw materials and packaging components.",
         "USE CASE: SUPPLIER SOURCING",
         "Packaging stock is depleted; Oppora dispatches TinyFish to crawl supplier portals, returning verified quotes, minimum order quantities (MOQ), and direct contact links.")
    ]

    for i, (aud_title, aud_bg, aud_desc, uc_head, uc_body) in enumerate(audiences):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(1.85)
        c_w = Inches(3.733)
        c_h = Inches(5.05)

        add_neo_box(s3, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
        add_badge(s3, c_left + Inches(0.2), c_top + Inches(0.2), c_w - Inches(0.4), Inches(0.38), aud_title, bg_color=aud_bg, font_size=10)

        tb = s3.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.7), c_w - Inches(0.4), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = f"PROFILE:\n{aud_desc}\n"
        p1.font.size = Pt(10)
        p1.font.color.rgb = TEXT_MUTED
        p1.font.name = "Arial"

        # Inner scenario box
        p2 = tf.add_paragraph()
        p2.text = f"{uc_head}\n"
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = INK_BLACK
        p2.font.name = "Arial Black"

        p3 = tf.add_paragraph()
        p3.text = uc_body
        p3.font.size = Pt(10)
        p3.font.color.rgb = INK_BLACK
        p3.font.name = "Arial"

    # =========================================================================
    # SLIDE 4: Proposed Solution
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_canvas(s4)
    add_header(s4, "THE PROPOSED SOLUTION: CLOSED-LOOP COPILOT", "PRODUCT OVERVIEW", "04", badge_color=CYBER_LIME)

    # 6-Step Loop Badges Banner across top
    loop_badges = [
        ("1. STORE RECORDS", CARD_WHITE),
        ("2. AI ANALYSIS", CARD_WHITE),
        ("3. WEB RESEARCH", CARD_WHITE),
        ("4. ACTION PROPOSAL", CARD_WHITE),
        ("5. USER APPROVAL", CYBER_LIME),
        ("6. RECORDED OUTCOME", CARD_WHITE)
    ]
    for i, (step_txt, step_bg) in enumerate(loop_badges):
        s_left = Inches(0.8 + i * 1.98)
        add_neo_box(s4, s_left, Inches(1.85), Inches(1.85), Inches(0.55), bg_color=step_bg, shadow_offset=0.04, border_width=2.0)
        tb_step = s4.shapes.add_textbox(s_left, Inches(1.85), Inches(1.85), Inches(0.55))
        tf_s = tb_step.text_frame
        p = tf_s.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = step_txt
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = INK_BLACK
        p.font.name = "Arial Black"

    # 4 Neo-Brutalist Solution Cards (2x2 Grid)
    sol_cards = [
        ("LIVE INVENTORY LEDGER", ICE_LIGHT,
         "Deterministic PostgreSQL stock ledger with atomic RPCs (record_sale, cancel_sale). Real-time run-rate monitoring and zero inventory drift.",
         "DATABASE: SUPABASE ACID RPCs"),
        ("GROUNDED OPERATIONS AI", MINT_LIGHT,
         "Google Gemini 3.5 Flash engine retrieves store parameters (lead times, margins, velocity) to explain operational next steps in plain English.",
         "INTELLIGENCE: GEMINI 3.5 FLASH"),
        ("TINYFISH WEB AGENT", CANARY_LIGHT,
         "Autonomous browser agent that crawls public supplier websites to extract verified MOQs, catalog pricing, and contact emails with live source URLs.",
         "RESEARCH: AGENT.TINYFISH.AI"),
        ("HUMAN-IN-THE-LOOP ACTION CENTRE", CORAL_LIGHT,
         "Strict operational guardrail: AI proposes restocks, price changes, and supplier quote emails, but changes require explicit founder approval.",
         "GUARDRAIL: ZERO HALLUCINATED ACTIONS")
    ]

    for i, (sc_title, sc_bg, sc_desc, sc_sub) in enumerate(sol_cards):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 5.95)
        c_top = Inches(2.65 + r * 2.15)
        c_w = Inches(5.75)
        c_h = Inches(1.95)

        add_neo_box(s4, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.07, border_width=2.5)
        add_badge(s4, c_left + Inches(0.2), c_top + Inches(0.18), c_w - Inches(0.4), Inches(0.35), sc_title, bg_color=sc_bg, font_size=10)

        tb = s4.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.6), c_w - Inches(0.4), c_h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = sc_desc
        p1.font.size = Pt(11)
        p1.font.color.rgb = INK_BLACK
        p1.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.text = f"\n[{sc_sub}]"
        p2.font.size = Pt(9)
        p2.font.bold = True
        p2.font.color.rgb = SOLID_BLACK
        p2.font.name = "Consolas"

    # =========================================================================
    # SLIDE 5: Product Workflow and Concrete Walkthrough
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_canvas(s5)
    add_header(s5, "END-TO-END WALKTHROUGH: AUTONOMOUS RESTOCK", "CONCRETE SCENARIO", "05", badge_color=CYBER_LIME)

    # Illustrative Scenario Bar
    add_neo_box(s5, Inches(0.8), Inches(1.85), Inches(11.733), Inches(0.65), bg_color=CYBER_LIME, shadow_offset=0.05, border_width=2.5)
    tb_sc = s5.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.3), Inches(0.55))
    tf_sc = tb_sc.text_frame
    p_sc = tf_sc.paragraphs[0]
    p_sc.text = "ILLUSTRATIVE CASE: 'Eco Kraft Standup Pouch' (SKU: PKG-ECO-01)  |  Stock: 28 Units  |  Lead Time: 7 Days"
    p_sc.font.size = Pt(12)
    p_sc.font.bold = True
    p_sc.font.color.rgb = INK_BLACK
    p_sc.font.name = "Arial Black"

    # 4 Pipeline Stage Cards
    pipeline = [
        ("STAGE 1: SALES LOGGED", CARD_WHITE,
         "POS transactions record 45 units sold in 72 hours. Supabase atomic RPC decrements store stock to 28 units.",
         "SYSTEM: POSTGRESQL ACID"),
        ("STAGE 2: GAP ANALYSIS", CANARY_LIGHT,
         "Deterministic math computes 9.2 units/day burn. 28 / 9.2 = 3.0 days of runway remaining vs 7-day supplier lead time (4-day deficit).",
         "SYSTEM: TS LOGIC ENGINE"),
        ("STAGE 3: WEB SOURCING", ICE_LIGHT,
         "TinyFish checks primary supplier portal, confirms $2.20/unit @ 150 MOQ, and Gemini pre-drafts quote email inquiry.",
         "SYSTEM: TINYFISH + GEMINI"),
        ("STAGE 4: FOUNDER APPROVAL", MINT_LIGHT,
         "Founder reviews restock proposal in Action Centre, verifies draft email, clicks 'Approve Order', writing persistent PO.",
         "SYSTEM: FOUNDER APPROVAL")
    ]

    for i, (stg_head, stg_bg, stg_body, stg_sys) in enumerate(pipeline):
        c_left = Inches(0.8 + i * 2.95)
        c_top = Inches(2.7)
        c_w = Inches(2.8)
        c_h = Inches(4.2)

        add_neo_box(s5, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.07, border_width=2.5)
        add_badge(s5, c_left + Inches(0.15), c_top + Inches(0.18), c_w - Inches(0.3), Inches(0.38), stg_head, bg_color=stg_bg, font_size=9)

        tb = s5.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.65), c_w - Inches(0.3), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = stg_body
        p1.font.size = Pt(10)
        p1.font.color.rgb = INK_BLACK
        p1.font.name = "Arial"

        p2 = tf.add_paragraph()
        p2.text = f"\n\n\n[{stg_sys}]"
        p2.font.size = Pt(9)
        p2.font.bold = True
        p2.font.color.rgb = SOLID_BLACK
        p2.font.name = "Consolas"

    # =========================================================================
    # SLIDE 6: Role of AI and Machine Learning
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    apply_canvas(s6)
    add_header(s6, "AI ARCHITECTURE: GENERATIVE AI VS DETERMINISTIC CODE", "AI & MACHINE LEARNING", "06", badge_color=CYBER_LIME)

    ai_cols = [
        ("GENERATIVE AI", MINT_LIGHT, "Google Gemini 3.5 Flash",
         [
             "Translates plain English queries into operational insights",
             "Summarizes complex inventory logs and sales patterns",
             "Drafts personalized supplier inquiry and RFQ emails",
             "Explains mathematical reasoning for restock urgency",
             "STRICT BOUNDARY: Does not calculate financial or inventory balances directly"
         ]),
        ("DETERMINISTIC LOGIC", ICE_LIGHT, "TypeScript & PostgreSQL",
         [
             "Calculates reorder points: Safety Stock + Lead Time Demand",
             "Enforces ACID consistency across sales and stock ledgers",
             "Guarantees multi-tenant data isolation with RLS",
             "Prevents hallucination by supplying verified store context",
             "STRICT BOUNDARY: Non-negotiable transaction source of truth"
         ]),
        ("PREDICTIVE ML", CANARY_LIGHT, "Proposed Phase 2 Roadmap",
         [
             "Time-series demand forecasting (Prophet / ARIMA)",
             "Dynamic supplier lead-time drift estimation",
             "Seasonal stocking recommendations based on historical cycles",
             "Automated anomaly detection for sudden sales drop-offs",
             "STRICT BOUNDARY: Requires 6+ months of historical business data"
         ])
    ]

    for i, (col_head, col_bg, col_engine, col_pts) in enumerate(ai_cols):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(1.85)
        c_w = Inches(3.733)
        c_h = Inches(5.05)

        add_neo_box(s6, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
        add_badge(s6, c_left + Inches(0.2), c_top + Inches(0.2), c_w - Inches(0.4), Inches(0.4), col_head, bg_color=col_bg, font_size=11)

        tb = s6.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.7), c_w - Inches(0.4), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p_eng = tf.paragraphs[0]
        p_eng.text = f"ENGINE: {col_engine}\n"
        p_eng.font.size = Pt(10)
        p_eng.font.bold = True
        p_eng.font.color.rgb = SOLID_BLACK
        p_eng.font.name = "Consolas"

        for pt in col_pts:
            p = tf.add_paragraph()
            prefix = "[!] " if "STRICT" in pt else "- "
            p.text = f"{prefix}{pt}"
            p.font.size = Pt(9.5)
            if "STRICT" in pt:
                p.font.bold = True
                p.font.color.rgb = CORAL_ALERT
            else:
                p.font.color.rgb = INK_BLACK
            p.font.name = "Arial"

    # =========================================================================
    # SLIDE 7: Proposed Technical Architecture
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    apply_canvas(s7)
    add_header(s7, "SYSTEM ARCHITECTURE: MULTI-TIER PIPELINE", "TECHNICAL ARCHITECTURE", "07", badge_color=CYBER_LIME)

    arch_tiers = [
        ("1. PRESENTATION TIER", "Next.js 14 App Router, React 18, Tailwind CSS, Lucide UI", "IMPLEMENTED & VERIFIED", ICE_LIGHT),
        ("2. APPLICATION & API TIER", "Next.js Route Handlers, Tenant Auth Resolver, Deterministic Reorder Engine", "IMPLEMENTED & VERIFIED", ICE_LIGHT),
        ("3. OPERATIONAL DATA TIER", "Supabase PostgreSQL, Row-Level Security (RLS), 12 Relational Tables, Atomic RPCs", "IMPLEMENTED & VERIFIED", MINT_LIGHT),
        ("4. INTELLIGENCE TIER", "Google Gemini 3.5 Flash, Grounded Prompt Synthesis, Natural Language Copilot", "IMPLEMENTED & VERIFIED", MINT_LIGHT),
        ("5. WEB INTELLIGENCE TIER", "TinyFish Autonomous Web Agent, Dynamic DOM Scraping, Supplier Catalog Extraction", "IMPLEMENTED & VERIFIED", CANARY_LIGHT),
        ("6. ACTION & AUDIT TIER", "Human-in-the-Loop Action Centre, Email Dispatcher, Immutable Activity Audit Logs", "IMPLEMENTED & VERIFIED", CYBER_LIME)
    ]

    for i, (t_name, t_tech, t_status, t_badge_bg) in enumerate(arch_tiers):
        t_top = Inches(1.85 + i * 0.82)
        t_w = Inches(11.733)
        t_h = Inches(0.72)

        add_neo_box(s7, Inches(0.8), t_top, t_w, t_h, bg_color=CARD_WHITE, shadow_offset=0.04, border_width=2.0)
        
        # Left Badge
        add_badge(s7, Inches(0.95), t_top + Inches(0.12), Inches(2.9), Inches(0.48), t_name, bg_color=t_badge_bg, font_size=9)

        # Content text
        tb = s7.shapes.add_textbox(Inches(4.0), t_top + Inches(0.08), Inches(5.6), Inches(0.55))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = t_tech
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = INK_BLACK
        p.font.name = "Arial"

        # Right status badge
        add_badge(s7, Inches(9.8), t_top + Inches(0.12), Inches(2.55), Inches(0.48), f"[{t_status}]", bg_color=CARD_WHITE, font_size=8)

    # =========================================================================
    # SLIDE 8: Proposed TinyFish Integration
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    apply_canvas(s8)
    add_header(s8, "TINYFISH INTEGRATION: AUTONOMOUS WEB INTELLIGENCE", "WEB INTELLIGENCE", "08", badge_color=CYBER_LIME)

    # Left: Core Capabilities
    add_neo_box(s8, Inches(0.8), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
    add_badge(s8, Inches(1.0), Inches(2.05), Inches(3.8), Inches(0.38), "TINYFISH AGENT CAPABILITIES", bg_color=CYBER_LIME, font_size=10)

    tb8_l = s8.shapes.add_textbox(Inches(1.0), Inches(2.55), Inches(5.25), Inches(4.15))
    tf8_l = tb8_l.text_frame
    tf8_l.word_wrap = True

    tf_features = [
        ("AUTONOMOUS BROWSER TRAVERSAL", "Executes multi-step browser interactions across dynamic manufacturer catalogs, supplier directories, and trade portals without brittle static scrapers."),
        ("DYNAMIC EXTRACTION & NORMALIZATION", "Extracts structured pricing tiers, minimum order quantities (MOQs), contact email addresses, and verified lead times."),
        ("FULL SOURCE ATTRIBUTABILITY", "Returns verifiable source URLs and scrape timestamps, preventing hallucinated vendor contact information."),
        ("DATA ISOLATION ARCHITECTURE", "TinyFish never touches private customer records or sales history; it operates exclusively on public web endpoints.")
    ]
    for idx, (head, desc) in enumerate(tf_features):
        p_h = tf8_l.add_paragraph() if idx > 0 else tf8_l.paragraphs[0]
        p_h.text = f"[>] {head}"
        p_h.font.size = Pt(11)
        p_h.font.bold = True
        p_h.font.color.rgb = INK_BLACK
        p_h.font.name = "Arial Black"

        p_d = tf8_l.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.font.name = "Arial"

    # Right: Verified 6-Step Sequence
    add_neo_box(s8, Inches(6.88), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=ICE_LIGHT, shadow_offset=0.08, border_width=3.0)
    add_badge(s8, Inches(7.1), Inches(2.05), Inches(3.8), Inches(0.38), "VERIFIED EXECUTION SEQUENCE", bg_color=CARD_WHITE, font_size=10)

    tb8_r = s8.shapes.add_textbox(Inches(7.1), Inches(2.55), Inches(5.25), Inches(4.15))
    tf8_r = tb8_r.text_frame
    tf8_r.word_wrap = True

    tf_steps = [
        ("1. RESTOCK ALERT TRIGGER", "Founder asks: 'Find local compostable mailer suppliers' or low stock triggers auto-search."),
        ("2. API DISPATCH", "Oppora posts structured request to `https://agent.tinyfish.ai/v1/automation/run`."),
        ("3. HEADLESS TRAVERSAL", "TinyFish cloud agent searches catalogs and navigates vendor pages dynamically."),
        ("4. STRUCTURED EXTRACTION", "API returns verified JSON payload containing vendor name, website, MOQ, price, and email."),
        ("5. GROUNDED PRESENTATION", "Oppora renders interactive supplier cards with clickable source links in the UI."),
        ("6. 1-CLICK PROCUREMENT", "Founder clicks 'Draft Inquiry' to pre-populate an editable quotation request.")
    ]
    for idx, (head, desc) in enumerate(tf_steps):
        p_h = tf8_r.add_paragraph() if idx > 0 else tf8_r.paragraphs[0]
        p_h.text = head
        p_h.font.size = Pt(10.5)
        p_h.font.bold = True
        p_h.font.color.rgb = INK_BLACK
        p_h.font.name = "Arial Black"

        p_d = tf8_r.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = INK_BLACK
        p_d.font.name = "Arial"

    # =========================================================================
    # SLIDE 9: Expected Impact & Measurement Framework
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    apply_canvas(s9)
    add_header(s9, "EXPECTED OPERATIONAL IMPACT & MEASUREMENT", "IMPACT & METRICS", "09", badge_color=CYBER_LIME)

    # 3 Top Metric Cards
    top_metrics = [
        ("70% FASTER SOURCING", CYBER_LIME, "Reduces vendor discovery and MOQ research from 3-4 hours of manual tab-hopping to under 2 minutes of autonomous execution."),
        ("ZERO UNPLANNED STOCKOUTS", MINT_LIGHT, "Proactive run-rate alerts trigger 5-7 days before depletion, protecting against lost e-commerce revenue."),
        ("5-10 HOURS SAVED / WEEK", CANARY_LIGHT, "Replaces manual spreadsheet cross-referencing and PO drafting with a unified 1-click Action Centre.")
    ]
    for i, (m_head, m_bg, m_desc) in enumerate(top_metrics):
        c_left = Inches(0.8 + i * 4.0)
        c_w = Inches(3.733)
        c_h = Inches(1.5)
        add_neo_box(s9, c_left, Inches(1.85), c_w, c_h, bg_color=m_bg, shadow_offset=0.06, border_width=2.5)

        tb = s9.shapes.add_textbox(c_left + Inches(0.15), Inches(1.9), c_w - Inches(0.3), c_h - Inches(0.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = m_head
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = INK_BLACK
        p1.font.name = "Arial Black"

        p2 = tf.add_paragraph()
        p2.text = m_desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = INK_BLACK
        p2.font.name = "Arial"

    # Measurement Framework Table
    table_shape = s9.shapes.add_table(5, 4, Inches(0.8), Inches(3.6), Inches(11.733), Inches(3.2))
    table = table_shape.table
    table.columns[0].width = Inches(2.6)
    table.columns[1].width = Inches(2.6)
    table.columns[2].width = Inches(3.3)
    table.columns[3].width = Inches(3.233)

    headers = ["METRIC", "MANUAL BASELINE", "OPPORA TARGET", "MEASUREMENT PROTOCOL"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = INK_BLACK
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = CYBER_LIME
        p.font.name = "Arial Black"

    row_data = [
        ("Supplier Discovery Time", "3-4 hours per vendor search", "< 2 minutes per automated query", "Logged API duration from query to structured cards"),
        ("Stockout Incident Rate", "Reactive alerts after stock depletion", "Zero unplanned stockouts on tracked SKUs", "Track count of stockout events vs. proactive alerts"),
        ("Reorder Decision Latency", "24-48 hours from awareness to PO", "< 5 minutes from alert to approved PO", "Timestamps from action proposal to user approval"),
        ("Inventory Ledger Accuracy", "Frequent sync drift across sheets", "100% atomic consistency across transactions", "Automated reconciliation checks on Supabase RPCs")
    ]

    for row_idx, r in enumerate(row_data):
        for col_idx, val in enumerate(r):
            cell = table.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_WHITE if row_idx % 2 == 0 else CANVAS_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            p.font.bold = (col_idx == 0 or col_idx == 2)
            p.font.color.rgb = INK_BLACK
            p.font.name = "Arial"

    # =========================================================================
    # SLIDE 10: Feasibility & Implementation Status
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    apply_canvas(s10)
    add_header(s10, "FEASIBILITY & IMPLEMENTATION STATUS: VERIFIED CODEBASE", "IMPLEMENTATION STATUS", "10", badge_color=CYBER_LIME)

    # Status Banner
    add_neo_box(s10, Inches(0.8), Inches(1.85), Inches(11.733), Inches(0.65), bg_color=CYBER_LIME, shadow_offset=0.05, border_width=2.5)
    tb_sb = s10.shapes.add_textbox(Inches(1.0), Inches(1.9), Inches(11.3), Inches(0.55))
    tf_sb = tb_sb.text_frame
    p_sb = tf_sb.paragraphs[0]
    p_sb.text = "VERIFIED AUDIT STATUS: 99 / 99 Automated Tests Passing  |  44 Production Routes Compiled  |  Zero Lint/Type Errors"
    p_sb.font.size = Pt(11)
    p_sb.font.bold = True
    p_sb.font.color.rgb = INK_BLACK
    p_sb.font.name = "Arial Black"

    # Status Table
    table_shape10 = s10.shapes.add_table(6, 4, Inches(0.8), Inches(2.65), Inches(11.733), Inches(4.2))
    table10 = table_shape10.table
    table10.columns[0].width = Inches(2.8)
    table10.columns[1].width = Inches(2.2)
    table10.columns[2].width = Inches(4.5)
    table10.columns[3].width = Inches(2.233)

    h10 = ["MODULE / CAPABILITY", "STATUS", "TECHNICAL IMPLEMENTATION & EVIDENCE", "OPERATIONAL RISK"]
    for col_idx, h in enumerate(h10):
        cell = table10.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = INK_BLACK
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = CYBER_LIME
        p.font.name = "Arial Black"

    status_rows = [
        ("Inventory & Stock Ledger", "IMPLEMENTED & VERIFIED", "12 Supabase tables, atomic RPCs (record_sale, cancel_sale), pass rate: 100%", "ZERO (ACID PROTECTED)"),
        ("Multi-Tenant Security", "IMPLEMENTED & VERIFIED", "Strict tenant_id session verification; production header injection blocked", "MITIGATED (TESTED)"),
        ("Google Gemini Copilot", "IMPLEMENTED & VERIFIED", "Live Gemini 3.5 Flash operational; contextual fallback cascade enabled", "LOW (GRACEFUL DEGRADATION)"),
        ("TinyFish Web Agent", "IMPLEMENTED & VERIFIED", "Live endpoint agent.tinyfish.ai verified; 1-click supplier shortcut in table", "LOW (VERIFIED HTTP 200)"),
        ("Action Centre & POs", "IMPLEMENTED & VERIFIED", "Pending action approvals, editable email modal, activity logging verified", "ZERO (HUMAN CONTROL)"),
    ]

    for row_idx, r in enumerate(status_rows):
        for col_idx, val in enumerate(r):
            cell = table10.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_WHITE if row_idx % 2 == 0 else CANVAS_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            if col_idx == 1:
                p.font.bold = True
                p.font.color.rgb = MINT_EMERALD
            elif col_idx == 3:
                p.font.bold = True
                p.font.color.rgb = INK_BLACK
            else:
                p.font.color.rgb = INK_BLACK
            p.font.name = "Arial"

    # =========================================================================
    # SLIDE 11: Competitive Differentiation
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    apply_canvas(s11)
    add_header(s11, "COMPETITIVE DIFFERENTIATION: THE CLOSED-LOOP ADVANTAGE", "DIFFERENTIATION", "11", badge_color=CYBER_LIME)

    comps = [
        ("TRADITIONAL ERPS", CARD_WHITE, "SAP / NetSuite",
         [
             "[X] Prohibitive cost ($10k-$50k/year)",
             "[X] 3-6 months implementation cycle",
             "[X] No autonomous web intelligence",
             "[X] Overwhelming UI for lean teams",
             "[V] Robust accounting foundation"
         ]),
        ("STANDALONE CHATBOTS", CORAL_LIGHT, "ChatGPT / Claude",
         [
             "[X] No connection to real-time stock ledger",
             "[X] Hallucinates inventory quantities",
             "[X] Cannot execute transactional updates",
             "[X] No multi-tenant database isolation",
             "[V] High general linguistic fluency"
         ]),
        ("SPREADSHEETS & SAAS", CANARY_LIGHT, "Excel / Airtable / Sortly",
         [
             "[X] Disconnected from supplier websites",
             "[X] Zero predictive run-rate alerts",
             "[X] Manual copy-pasting for reorders",
             "[X] Prone to accidental overwrites",
             "[V] Familiar low-cost interface"
         ]),
        ("OPPORA COPILOT", CYBER_LIME, "Closed-Loop System",
         [
             "[V] Live PostgreSQL transactional ledger",
             "[V] Grounded Gemini natural language analysis",
             "[V] Autonomous TinyFish supplier discovery",
             "[V] Action Centre with human-in-the-loop control",
             "[V] Purpose-built for agile founders & SMBs"
         ])
    ]

    for i, (c_name, c_bg, c_sub, pts) in enumerate(comps):
        c_left = Inches(0.8 + i * 2.95)
        c_top = Inches(1.85)
        c_w = Inches(2.8)
        c_h = Inches(5.05)

        add_neo_box(s11, c_left, c_top, c_w, c_h, bg_color=c_bg, shadow_offset=0.08, border_width=3.0)
        add_badge(s11, c_left + Inches(0.15), c_top + Inches(0.18), c_w - Inches(0.3), Inches(0.38), c_name, bg_color=SOLID_BLACK, font_size=9, text_color=CARD_WHITE)

        tb = s11.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.65), c_w - Inches(0.3), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p_sub = tf.paragraphs[0]
        p_sub.text = f"{c_sub}\n"
        p_sub.font.size = Pt(10)
        p_sub.font.bold = True
        p_sub.font.color.rgb = INK_BLACK
        p_sub.font.name = "Consolas"

        for pt in pts:
            pb = tf.add_paragraph()
            pb.text = pt
            pb.font.size = Pt(9.5)
            if "[V]" in pt:
                pb.font.bold = True
                pb.font.color.rgb = INK_BLACK
            else:
                pb.font.color.rgb = TEXT_MUTED
            pb.font.name = "Arial"

    # =========================================================================
    # SLIDE 12: Future Scope and Roadmap
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    apply_canvas(s12)
    add_header(s12, "STRATEGIC ROADMAP: CORE TO AUTONOMOUS ECOSYSTEM", "STRATEGIC ROADMAP", "12", badge_color=CYBER_LIME)

    phases = [
        ("PHASE 1: OPERATIONAL CORE", CYBER_LIME, "Current Hackathon Benchmark [COMPLETED]",
         [
             "- Multi-tenant Supabase PostgreSQL architecture with RLS",
             "- Atomic inventory ledger with sales & restock transactions",
             "- Google Gemini 3.5 Flash contextual copilot",
             "- TinyFish autonomous web research agent for suppliers",
             "- Action Centre with human-in-the-loop email drafts & approvals",
             "- 99/99 automated tests passing across 44 production routes"
         ]),
        ("PHASE 2: PREDICTIVE INTEL", ICE_LIGHT, "Target: Next 3-6 Months [PROPOSED]",
         [
             "- Statistical time-series demand forecasting (Prophet / ARIMA)",
             "- Dynamic supplier lead-time drift & reliability scoring",
             "- Multi-warehouse & retail store transfer balancing",
             "- Automated reorder threshold tuning based on seasonal trends",
             "- Batch PO generation across multiple preferred suppliers",
             "- Granular team permissions (Owner, Manager, Auditor)"
         ]),
        ("PHASE 3: CONNECTED ECOSYSTEM", CANARY_LIGHT, "Target: Next 6-12 Months [PROPOSED]",
         [
             "- Bi-directional Shopify, Amazon, and WooCommerce sync",
             "- Accounting integrations (QuickBooks, Xero, Stripe)",
             "- Multi-agent automated quotation negotiation via TinyFish",
             "- Real-time carrier tracking (FedEx, UPS, Freight)",
             "- Autonomous capital & working line of credit discovery"
         ])
    ]

    for i, (p_title, p_bg, p_time, items) in enumerate(phases):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(1.85)
        c_w = Inches(3.733)
        c_h = Inches(5.05)

        add_neo_box(s12, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
        add_badge(s12, c_left + Inches(0.2), c_top + Inches(0.2), c_w - Inches(0.4), Inches(0.4), p_title, bg_color=p_bg, font_size=10)

        tb = s12.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.7), c_w - Inches(0.4), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = f"{p_time}\n"
        p_t.font.size = Pt(9.5)
        p_t.font.bold = True
        p_t.font.color.rgb = SOLID_BLACK
        p_t.font.name = "Consolas"

        for item in items:
            pi = tf.add_paragraph()
            pi.text = item
            pi.font.size = Pt(9.5)
            pi.font.color.rgb = INK_BLACK
            pi.font.name = "Arial"

    # =========================================================================
    # SLIDE 13: Conclusion
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    apply_canvas(s13)
    add_header(s13, "CONCLUSION: EMPOWERING FOUNDERS TO GROW FURTHER", "CONCLUSION", "13", badge_color=CYBER_LIME)

    # Giant Neo-Brutalist Quote Box
    add_neo_box(s13, Inches(0.8), Inches(1.85), Inches(11.733), Inches(1.75), bg_color=CYBER_LIME, shadow_offset=0.09, border_width=3.5)
    tb_q = s13.shapes.add_textbox(Inches(1.1), Inches(1.95), Inches(11.1), Inches(1.5))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True

    pq1 = tf_q.paragraphs[0]
    pq1.text = "\"Oppora replaces the chaos of disconnected spreadsheets and reactive fire-fighting with a unified, verified operational copilot—connecting live inventory data, grounded AI reasoning, and autonomous web intelligence.\""
    pq1.font.size = Pt(16)
    pq1.font.bold = True
    pq1.font.color.rgb = INK_BLACK
    pq1.font.name = "Arial Black"

    # 3 Summary Pillars
    sum_pillars = [
        ("UNIFIED OPERATIONAL TRUTH", ICE_LIGHT, "All stock levels, sales velocity, and supplier interactions live in a single ACID-compliant database ledger."),
        ("AUTONOMOUS EXTERNAL REACH", CANARY_LIGHT, "TinyFish extends the founder's awareness beyond internal spreadsheets into the live, evolving web."),
        ("FOUNDER IN COMPLETE CONTROL", MINT_LIGHT, "Deterministic business rules and human approvals prevent AI hallucination and operational errors.")
    ]
    for i, (s_head, s_bg, s_desc) in enumerate(sum_pillars):
        c_left = Inches(0.8 + i * 4.0)
        c_top = Inches(3.9)
        c_w = Inches(3.733)
        c_h = Inches(3.0)

        add_neo_box(s13, c_left, c_top, c_w, c_h, bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
        add_badge(s13, c_left + Inches(0.2), c_top + Inches(0.2), c_w - Inches(0.4), Inches(0.4), s_head, bg_color=s_bg, font_size=10)

        tb = s13.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.7), c_w - Inches(0.4), c_h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = s_desc
        p.font.size = Pt(11)
        p.font.color.rgb = INK_BLACK
        p.font.name = "Arial"

    # =========================================================================
    # SLIDE 14: Links & Research
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    apply_canvas(s14)
    add_header(s14, "LINKS & RESEARCH: OFFICIAL SOURCES & CITATIONS", "LINKS & RESEARCH", "14", badge_color=CYBER_LIME)

    # Left: Core Tech Documentation
    add_neo_box(s14, Inches(0.8), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
    add_badge(s14, Inches(1.0), Inches(2.05), Inches(3.8), Inches(0.38), "CORE TECHNOLOGY DOCUMENTATION", bg_color=ICE_LIGHT, font_size=10)

    tb14_l = s14.shapes.add_textbox(Inches(1.0), Inches(2.55), Inches(5.25), Inches(4.15))
    tf14_l = tb14_l.text_frame
    tf14_l.word_wrap = True

    tech_links = [
        ("TINYFISH WEB AGENT API", "https://agent.tinyfish.ai/v1/automation/run", "Official web agent execution endpoint for dynamic site traversal & scraping."),
        ("GOOGLE GEMINI API (GEMINI 3.5 FLASH)", "https://ai.google.dev/gemini-api/docs", "Official documentation for Gemini multimodal models and structured prompting."),
        ("SUPABASE POSTGRESQL & ROW LEVEL SECURITY", "https://supabase.com/docs/guides/database", "Official guide on PostgreSQL ACID guarantees, RLS policies, and database webhooks."),
        ("NEXT.JS 14 FRAMEWORK DOCUMENTATION", "https://nextjs.org/docs", "App router documentation for server components, route handlers, and production builds.")
    ]
    for idx, (head, url, desc) in enumerate(tech_links):
        p_h = tf14_l.add_paragraph() if idx > 0 else tf14_l.paragraphs[0]
        p_h.text = f"[LINK] {head}"
        p_h.font.size = Pt(10.5)
        p_h.font.bold = True
        p_h.font.color.rgb = INK_BLACK
        p_h.font.name = "Arial Black"

        p_u = tf14_l.add_paragraph()
        p_u.text = f"{url}"
        p_u.font.size = Pt(8.5)
        p_u.font.bold = True
        p_u.font.color.rgb = SOLID_BLACK
        p_u.font.name = "Consolas"

        p_d = tf14_l.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.font.name = "Arial"

    # Right: Industry Citations
    add_neo_box(s14, Inches(6.88), Inches(1.85), Inches(5.65), Inches(5.05), bg_color=CARD_WHITE, shadow_offset=0.08, border_width=3.0)
    add_badge(s14, Inches(7.1), Inches(2.05), Inches(3.8), Inches(0.38), "VERIFIED INDUSTRY & ACADEMIC SOURCES", bg_color=MINT_LIGHT, font_size=10)

    tb14_r = s14.shapes.add_textbox(Inches(7.1), Inches(2.55), Inches(5.25), Inches(4.15))
    tf14_r = tb14_r.text_frame
    tf14_r.word_wrap = True

    industry_links = [
        ("U.S. SMALL BUSINESS ADMINISTRATION (SBA)", "https://www.sba.gov/business-guide/manage-your-business", "Research on small business time allocation: 40%+ of founder bandwidth spent on non-revenue admin operations."),
        ("NATIONAL RETAIL FEDERATION (NRF) / IHL GROUP", "https://nrf.com/research", "Global inventory distortion analysis: $1.1 Trillion lost annually due to out-of-stocks and inventory miscalculation."),
        ("OPPORA REPOSITORY & AUTOMATED TEST SUITE", "Local Workspace & GitHub Repo (Commit df60b59)", "All 99 automated tests passing, master remediation verification report logged in repository.")
    ]
    for idx, (head, url, desc) in enumerate(industry_links):
        p_h = tf14_r.add_paragraph() if idx > 0 else tf14_r.paragraphs[0]
        p_h.text = f"[SOURCE] {head}"
        p_h.font.size = Pt(10.5)
        p_h.font.bold = True
        p_h.font.color.rgb = INK_BLACK
        p_h.font.name = "Arial Black"

        p_u = tf14_r.add_paragraph()
        p_u.text = f"{url}"
        p_u.font.size = Pt(8.5)
        p_u.font.bold = True
        p_u.font.color.rgb = SOLID_BLACK
        p_u.font.name = "Consolas"

        p_d = tf14_r.add_paragraph()
        p_d.text = f"{desc}\n"
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.font.name = "Arial"

    output_path = "Oppora_Hackathon_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {os.path.abspath(output_path)}")
    print(f"Total slides generated: {len(prs.slides)}")

if __name__ == "__main__":
    create_deck()
