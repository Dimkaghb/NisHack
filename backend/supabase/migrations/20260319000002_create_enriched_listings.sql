-- Create enriched_listings table for storing enrichment data per listing
CREATE TABLE IF NOT EXISTS enriched_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    footfall_raw INTEGER DEFAULT 0,
    footfall_score DOUBLE PRECISION DEFAULT 0,
    competitor_count INTEGER DEFAULT 0,
    competitor_score DOUBLE PRECISION DEFAULT 0,
    transit_score DOUBLE PRECISION DEFAULT 0,
    bus_stops_nearby INTEGER DEFAULT 0,
    metro_distance_m DOUBLE PRECISION,
    nearest_metro_name TEXT,
    transit_stops_nearby JSONB DEFAULT '[]'::JSONB,
    enriched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One enrichment record per listing
    CONSTRAINT enriched_listings_listing_unique UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS idx_enriched_listings_listing_id ON enriched_listings (listing_id);
CREATE INDEX IF NOT EXISTS idx_enriched_listings_footfall ON enriched_listings (footfall_score);
CREATE INDEX IF NOT EXISTS idx_enriched_listings_competitor ON enriched_listings (competitor_count);

-- Updated_at trigger (reuses function from listings migration)
CREATE TRIGGER update_enriched_listings_updated_at
    BEFORE UPDATE ON enriched_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
