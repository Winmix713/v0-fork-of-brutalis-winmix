-- scripts/03-fix-column-names.sql
-- Enterprise-level SQL: Column Name Fixes and Constraint Refinements for 'matches' table.
-- This script addresses potential inconsistencies in column names and ensures
-- robust data integrity constraints are applied safely.

BEGIN; -- Start a transaction

-- 1. Safely handle constraint modifications
DO $$
BEGIN
    -- Drop constraint if it exists (safe approach before re-adding/modifying)
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'chk_goals_non_negative'
        AND table_name = 'matches'
    ) THEN
        ALTER TABLE public.matches DROP CONSTRAINT chk_goals_non_negative;
    END IF;
END $$;

-- Add the constraint with proper definition, referencing the correct column names
ALTER TABLE public.matches ADD CONSTRAINT chk_goals_non_negative CHECK (
    full_time_home_goals >= 0
    AND full_time_away_goals >= 0
    AND (half_time_home_goals IS NULL OR half_time_home_goals >= 0)
    AND (half_time_away_goals IS NULL OR half_time_away_goals >= 0)
);

-- 2. Safely rename columns if they exist with old names
--    This block ensures idempotency and avoids errors if columns are already renamed.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'matches'
        AND column_name = 'home_goals'
    ) THEN
        ALTER TABLE public.matches RENAME COLUMN home_goals TO full_time_home_goals;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'matches'
        AND column_name = 'away_goals'
    ) THEN
        ALTER TABLE public.matches RENAME COLUMN away_goals TO full_time_away_goals;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'matches'
        AND column_name = 'home_ht_score'
    ) THEN
        ALTER TABLE public.matches RENAME COLUMN home_ht_score TO half_time_home_goals;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'matches'
        AND column_name = 'away_ht_score'
    ) THEN
        ALTER TABLE public.matches RENAME COLUMN away_ht_score TO half_time_away_goals;
    END IF;

    -- Add more renames as needed for other columns like shots, cards if they had different names
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'home_team_name') THEN
        ALTER TABLE public.matches RENAME COLUMN home_team_name TO home_team;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'away_team_name') THEN
        ALTER TABLE public.matches RENAME COLUMN away_team_name TO away_team;
    END IF;

END $$;

-- 3. Add useful indexes for performance (if not already present in 001)
CREATE INDEX IF NOT EXISTS idx_matches_scores ON public.matches(full_time_home_goals, full_time_away_goals);
CREATE INDEX IF NOT EXISTS idx_matches_date_teams ON public.matches(match_time::DATE, home_team, away_team);

-- 4. Add comments for documentation (enterprise standard)
COMMENT ON TABLE public.matches IS 'Football match results with scores and metadata';
COMMENT ON COLUMN public.matches.full_time_home_goals IS 'Final goals scored by home team (non-negative)';
COMMENT ON COLUMN public.matches.full_time_away_goals IS 'Final goals scored by away team (non-negative)';
COMMENT ON COLUMN public.matches.half_time_home_goals IS 'Half-time goals scored by home team (non-negative)';
COMMENT ON COLUMN public.matches.half_time_away_goals IS 'Half-time goals scored by away team (non-negative)';
COMMENT ON COLUMN public.matches.home_team IS 'Name of the home team';
COMMENT ON COLUMN public.matches.away_team IS 'Name of the away team';

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Column names fixed and constraints refined successfully!' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'matches' AND column_name IN ('full_time_home_goals', 'full_time_away_goals', 'half_time_home_goals', 'half_time_away_goals', 'home_team', 'away_team');
