-- ==============================================================================
-- OPPORA 2.1: ACTIVITY EVENTS & ACTION CENTRE PERSISTENCE
-- AzinHack '26 Production Database Migration
-- ==============================================================================

-- 1. ACTIVITY EVENTS TABLE
-- Normalizes auditable operational timeline events with strict authenticated ownership.
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('proposed', 'approved', 'executed', 'failed')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.activity_events IS 'Auditable operational timeline recording proposed, approved, executed, and failed events with user tenant isolation.';

CREATE INDEX IF NOT EXISTS idx_activity_events_user_created ON public.activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_type ON public.activity_events(user_id, event_type);

-- 2. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_events_select_own" ON public.activity_events;
CREATE POLICY "activity_events_select_own" ON public.activity_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_events_insert_own" ON public.activity_events;
CREATE POLICY "activity_events_insert_own" ON public.activity_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_events_delete_own" ON public.activity_events;
CREATE POLICY "activity_events_delete_own" ON public.activity_events FOR DELETE USING (auth.uid() = user_id);
