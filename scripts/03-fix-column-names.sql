-- Fix column names in matches table to match expected format
-- This script standardizes column names and ensures data consistency

-- First, let's check current column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;

-- Rename columns if they don't match expected format
DO $$
BEGIN
    -- Check if columns need renaming
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'Match Time') THEN
        ALTER TABLE matches RENAME COLUMN "Match Time" TO match_time;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'Home Team') THEN
        ALTER TABLE matches RENAME COLUMN "Home Team" TO home_team;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'Away Team') THEN
        ALTER TABLE matches RENAME COLUMN "Away Team" TO away_team;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'HT Home Goals') THEN
        ALTER TABLE matches RENAME COLUMN "HT Home Goals" TO half_time_home_goals;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'HT Away Goals') THEN
        ALTER TABLE matches RENAME COLUMN "HT Away Goals" TO half_time_away_goals;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'FT Home Goals') THEN
        ALTER TABLE matches RENAME COLUMN "FT Home Goals" TO full_time_home_goals;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'FT Away Goals') THEN
        ALTER TABLE matches RENAME COLUMN "FT Away Goals" TO full_time_away_goals;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_matches_time ON matches(match_time);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team);

-- Add constraints to ensure data quality
ALTER TABLE matches 
ADD CONSTRAINT chk_goals_non_negative 
CHECK (
    half_time_home_goals >= 0 AND 
    half_time_away_goals >= 0 AND 
    full_time_home_goals >= 0 AND 
    full_time_away_goals >= 0
);

-- Ensure full-time goals are >= half-time goals
ALTER TABLE matches 
ADD CONSTRAINT chk_fulltime_gte_halftime 
CHECK (
    full_time_home_goals >= half_time_home_goals AND 
    full_time_away_goals >= half_time_away_goals
);

-- Update any null values with defaults
UPDATE matches 
SET 
    half_time_home_goals = 0 WHERE half_time_home_goals IS NULL,
    half_time_away_goals = 0 WHERE half_time_away_goals IS NULL,
    full_time_home_goals = 0 WHERE full_time_home_goals IS NULL,
    full_time_away_goals = 0 WHERE full_time_away_goals IS NULL;

-- Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM matches LIMIT 5;

-- Show table statistics
SELECT 
    COUNT(*) as total_matches,
    COUNT(DISTINCT home_team) as unique_home_teams,
    COUNT(DISTINCT away_team) as unique_away_teams,
    MIN(match_time) as earliest_match,
    MAX(match_time) as latest_match
FROM matches;
