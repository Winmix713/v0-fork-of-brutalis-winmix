-- supabase/migrations/001_create_matches_table.sql
-- Enterprise-level SQL Migration: Initial 'matches' table creation.
-- This script sets up the core table for storing football match data,
-- including robust schema, indexing, data integrity, and Row Level Security (RLS).

BEGIN; -- Start a transaction for atomicity

-- 1. Drop table if it exists (for clean recreation in development/testing environments)
--    In production, use ALTER TABLE if data needs to be preserved.
DROP TABLE IF EXISTS public.matches CASCADE;

-- 2. Create 'matches' table
CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY, -- Unique identifier for each match
    match_time TIMESTAMPTZ NOT NULL, -- Timestamp of the match (including date and time)
    league TEXT NOT NULL, -- League name (e.g., 'Premier League', 'La Liga')
    season TEXT, -- Season (e.g., '2023/2024')
    home_team TEXT NOT NULL, -- Name of the home team
    away_team TEXT NOT NULL, -- Name of the away team
    full_time_home_goals INTEGER NOT NULL, -- Full-time goals scored by home team
    full_time_away_goals INTEGER NOT NULL, -- Full-time goals scored by away team
    half_time_home_goals INTEGER, -- Half-time goals scored by home team
    half_time_away_goals INTEGER, -- Half-time goals scored by away team
    home_shots INTEGER, -- Total shots by home team
    away_shots INTEGER, -- Total shots by away team
    home_shots_on_target INTEGER, -- Shots on target by home team
    away_shots_on_target INTEGER, -- Shots on target by away team
    home_corners INTEGER, -- Corners by home team
    away_corners INTEGER, -- Corners by away team
    home_yellow_cards INTEGER, -- Yellow cards for home team
    away_yellow_cards INTEGER, -- Yellow cards for away team
    home_red_cards INTEGER, -- Red cards for home team
    away_red_cards INTEGER, -- Red cards for away team
    referee TEXT, -- Referee name
    venue TEXT, -- Match venue
    attendance INTEGER, -- Match attendance
    match_status TEXT NOT NULL DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'postponed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Audit column
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Audit column
);

-- 3. Add Data Integrity Constraints
ALTER TABLE public.matches
ADD CONSTRAINT chk_goals_non_negative
CHECK (
    full_time_home_goals >= 0 AND full_time_away_goals >= 0 AND
    (half_time_home_goals IS NULL OR half_time_home_goals >= 0) AND
    (half_time_away_goals IS NULL OR half_time_away_goals >= 0)
);

ALTER TABLE public.matches
ADD CONSTRAINT chk_shots_non_negative
CHECK (
    (home_shots IS NULL OR home_shots >= 0) AND
    (away_shots IS NULL OR away_shots >= 0) AND
    (home_shots_on_target IS NULL OR home_shots_on_target >= 0) AND
    (away_shots_on_target IS NULL OR away_shots_on_target >= 0)
);

ALTER TABLE public.matches
ADD CONSTRAINT chk_cards_non_negative
CHECK (
    (home_yellow_cards IS NULL OR home_yellow_cards >= 0) AND
    (away_yellow_cards IS NULL OR away_yellow_cards >= 0) AND
    (home_red_cards IS NULL OR home_red_cards >= 0) AND
    (away_red_cards IS NULL OR away_red_cards >= 0)
);

-- 4. Create Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_matches_time ON public.matches (match_time DESC);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches (league);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON public.matches (home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches (match_status);

-- 5. Create a function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update 'updated_at' timestamp
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 8. Define RLS Policies
--    Allow anonymous users to read all matches.
CREATE POLICY "Allow read access to matches" ON public.matches
    FOR SELECT USING (true);

--    Allow service_role to insert and update matches (backend/cron jobs).
CREATE POLICY "Allow insert/update for service role" ON public.matches
    FOR ALL USING (auth.role() = 'service_role'); -- For INSERT, UPDATE, DELETE

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Table public.matches created successfully!' AS status;
SELECT * FROM public.matches LIMIT 0; -- Show schema
