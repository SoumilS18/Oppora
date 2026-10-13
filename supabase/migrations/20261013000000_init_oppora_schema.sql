-- ==============================================================================
-- OPPORA PLATFORM DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- AZINHACK '26 Production Migration
-- ==============================================================================
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 2. USER PROFILES TABLE
-- Linked directly to auth.users. Automatically populated on signup via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    country TEXT DEFAULT 'India',
    state TEXT DEFAULT '',
    industry TEXT DEFAULT 'HealthTech & AI',
    startup_stage TEXT DEFAULT 'Prototype',
    organization_type TEXT DEFAULT 'Incorporated Startup',
    entity_type TEXT DEFAULT 'Private Limited (Pvt Ltd)',
    dpiit_recognized TEXT DEFAULT 'In Progress / Not Sure',
    funding_needs TEXT DEFAULT '',
    keywords TEXT [] DEFAULT '{}',
    startup_description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
COMMENT ON TABLE public.profiles IS 'Grounded founder and startup entity profiles linked to authenticated Supabase accounts.';
-- 3. SAVED OPPORTUNITIES TABLE
-- Persists bookmarked opportunities with a self-contained JSONB snapshot to guarantee
-- data availability even if source scraping criteria change.
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL,
    opportunity_snapshot JSONB NOT NULL,
    user_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_opportunity UNIQUE (user_id, opportunity_id)
);
COMMENT ON TABLE public.saved_opportunities IS 'Account-owned saved grants, accelerators, and competitions.';
-- Index for high-performance retrieval by user
CREATE INDEX IF NOT EXISTS idx_saved_opps_user_id ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_opps_opp_id ON public.saved_opportunities(opportunity_id);
-- 4. APPLICATION CHECKLIST PERSISTENCE TABLE
-- Normalizes checklist items and tracks completion status per user per opportunity.
CREATE TABLE IF NOT EXISTS public.saved_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_title TEXT,
    category TEXT,
    priority TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_opportunity_item UNIQUE (user_id, opportunity_id, item_id)
);
COMMENT ON TABLE public.saved_checklist_items IS 'Account-owned application readiness checklists with persistent task completion.';
CREATE INDEX IF NOT EXISTS idx_checklist_user_opp ON public.saved_checklist_items(user_id, opportunity_id);
-- 5. AUTOMATIC PROFILE INITIALIZATION TRIGGER
-- Idempotently creates a corresponding profile row whenever a new user signs up in auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        full_name,
        country,
        state,
        industry,
        startup_stage,
        organization_type,
        entity_type,
        dpiit_recognized,
        created_at,
        updated_at
    )
VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'India',
        '',
        'HealthTech & AI',
        'Prototype',
        'Incorporated Startup',
        'Private Limited (Pvt Ltd)',
        'In Progress / Not Sure',
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;
-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 6. UPDATED_AT TIMESTAMP AUTO-UPDATER
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trigger_checklist_updated_at ON public.saved_checklist_items;
CREATE TRIGGER trigger_checklist_updated_at BEFORE
UPDATE ON public.saved_checklist_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation: No user can read, write, or modify another account's data.
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_checklist_items ENABLE ROW LEVEL SECURITY;
-- ------------------------------------------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- ------------------------------------------------------------------------------
-- B. SAVED OPPORTUNITIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Users can read own saved opportunities" ON public.saved_opportunities FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Users can insert own saved opportunities" ON public.saved_opportunities FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Users can update own saved opportunities" ON public.saved_opportunities FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own saved opportunities" ON public.saved_opportunities;
CREATE POLICY "Users can delete own saved opportunities" ON public.saved_opportunities FOR DELETE USING (auth.uid() = user_id);
-- ------------------------------------------------------------------------------
-- C. SAVED CHECKLIST ITEMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own checklist items" ON public.saved_checklist_items;
CREATE POLICY "Users can read own checklist items" ON public.saved_checklist_items FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own checklist items" ON public.saved_checklist_items;
CREATE POLICY "Users can insert own checklist items" ON public.saved_checklist_items FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own checklist items" ON public.saved_checklist_items;
CREATE POLICY "Users can update own checklist items" ON public.saved_checklist_items FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own checklist items" ON public.saved_checklist_items;
CREATE POLICY "Users can delete own checklist items" ON public.saved_checklist_items FOR DELETE USING (auth.uid() = user_id);