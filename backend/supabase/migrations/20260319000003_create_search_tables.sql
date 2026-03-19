-- Search sessions: tracks each user search request and its status
CREATE TABLE IF NOT EXISTS search_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,  -- nullable until auth is added in Phase 7
    business_type TEXT NOT NULL,
    district TEXT,
    budget_tenge INTEGER,
    area_sqm_min INTEGER,
    competitor_tolerance INTEGER DEFAULT 5,
    weights_override JSONB,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending | running | complete | failed
    error_message TEXT,
    total_evaluated INTEGER DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_sessions_status ON search_sessions (status);
CREATE INDEX IF NOT EXISTS idx_search_sessions_user ON search_sessions (user_id) WHERE user_id IS NOT NULL;

CREATE TRIGGER update_search_sessions_updated_at
    BEFORE UPDATE ON search_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Search results: scored listings per search session
CREATE TABLE IF NOT EXISTS search_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES search_sessions(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    total_score DOUBLE PRECISION NOT NULL,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB,
    competitor_count INTEGER DEFAULT 0,
    bus_stops_nearby INTEGER DEFAULT 0,
    metro_distance_m DOUBLE PRECISION,
    nearest_metro_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT search_results_session_listing_unique UNIQUE (session_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_search_results_session ON search_results (session_id);
CREATE INDEX IF NOT EXISTS idx_search_results_score ON search_results (session_id, total_score DESC);
