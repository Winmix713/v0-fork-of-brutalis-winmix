-- supabase/migrations/002_create_predictions_table.sql
-- Enterprise-level SQL Migration: Initial 'predictions' table creation.
-- This script sets up the core table for storing football match predictions,
-- including robust schema, indexing, data integrity, and Row Level Security (RLS).
-- NOTE: This version focuses on the basic predictions table and cleanup function.
-- The enhanced predictions table and accuracy stats function are in 005_enhanced_predictions_table.sql.

BEGIN; -- Start a transaction for atomicity

-- 1. Drop table if it exists (for clean recreation in development/testing environments)
--    In production, use ALTER TABLE if data needs to be preserved.
DROP TABLE IF EXISTS public.predictions CASCADE;

-- 2. Create 'predictions' table
CREATE TABLE public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier, using UUID for distributed systems
    match_id INTEGER REFERENCES public.matches(id) ON DELETE SET NULL, -- Foreign key to the matches table, NULL on match deletion
    home_team TEXT NOT NULL, -- Name of the home team for the prediction
    away_team TEXT NOT NULL, -- Name of the away team for the prediction
    match_date DATE NOT NULL, -- Date of the match for which the prediction is made
    league TEXT NOT NULL, -- League of the match
    prediction_type TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'legend_mode', 'ai_enhanced', 'ensemble'
    
    -- Prediction probabilities (NUMERIC for precision)
    home_win_probability NUMERIC(5,4) NOT NULL CHECK (home_win_probability >= 0 AND home_win_probability <= 1),
    draw_probability NUMERIC(5,4) NOT NULL CHECK (draw_probability >= 0 AND draw_probability <= 1),
    away_win_probability NUMERIC(5,4) NOT NULL CHECK (away_win_probability >= 0 AND away_win_probability <= 1),
    
    -- Predicted scores (NUMERIC for potential fractional goals in models)
    predicted_home_goals NUMERIC(3,2),
    predicted_away_goals NUMERIC(3,2),
    predicted_total_goals NUMERIC(3,2),
    
    -- Confidence and metadata
    confidence_score NUMERIC(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- Model confidence in the prediction
    model_version TEXT, -- Version of the model used (e.g., 'legend_v1.0', 'basic_v1.0')
    features_used JSONB, -- JSONB to store the features used for prediction (flexible schema)
    cache_key TEXT NOT NULL UNIQUE, -- Unique key for caching, allows efficient upserts
    
    -- Prediction accuracy (filled after match completion)
    actual_result TEXT, -- 'home_win', 'draw', 'away_win' (NULL until match is played)
    prediction_correct BOOLEAN, -- TRUE if predicted result matches actual result
    probability_accuracy NUMERIC(5,4), -- Metric for how close predicted probabilities were to actual outcome
    
    -- Timestamps
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Timestamp when the prediction was generated
    expires_at TIMESTAMPTZ, -- Timestamp when the cached prediction should expire
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Audit column
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Audit column
);

-- 3. Add Data Integrity Constraints
ALTER TABLE public.predictions
ADD CONSTRAINT chk_probabilities_sum_to_one
CHECK (ABS((home_win_probability + draw_probability + away_win_probability) - 1.0) < 0.01); -- Tolerance for floating point arithmetic

-- 4. Create Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions (match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_teams_date ON public.predictions (home_team, away_team, match_date DESC); -- For quick lookup of specific match predictions
CREATE INDEX IF NOT EXISTS idx_predictions_type ON public.predictions (prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON public.predictions (match_date DESC); -- For time-based queries
CREATE INDEX IF NOT EXISTS idx_predictions_accuracy ON public.predictions (prediction_correct) WHERE prediction_correct IS NOT NULL; -- Partial index for accuracy reporting
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON public.predictions (confidence_score) WHERE confidence_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_expires_at ON public.predictions (expires_at) WHERE expires_at IS NOT NULL; -- For cache cleanup

-- 5. Create trigger to automatically update 'updated_at' timestamp (reusing existing function from 001)
CREATE TRIGGER update_predictions_updated_at
    BEFORE UPDATE ON public.predictions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
--    Allow anonymous users to read all predictions.
CREATE POLICY "Allow read access to predictions" ON public.predictions
    FOR SELECT USING (true);

--    Allow service_role to insert and update predictions (backend/cron jobs).
CREATE POLICY "Allow insert/update for service role" ON public.predictions
    FOR ALL USING (auth.role() = 'service_role'); -- For INSERT, UPDATE, DELETE

-- 8. Create a function to clean up old predictions (can be scheduled via Supabase Cron Jobs)
CREATE OR REPLACE FUNCTION public.cleanup_old_predictions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete predictions older than 90 days that are no longer relevant
    DELETE FROM public.predictions
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup operation (assuming a system_logs table exists or will be created)
    INSERT INTO system_logs (event_type, message, created_at)
    VALUES ('predictions_cleanup', format('Cleaned up %s old predictions', deleted_count), NOW());
END;
$$;

-- Grant execution permissions for cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_old_predictions() TO authenticated; -- Or specific role for cron job

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Table public.predictions created successfully!' AS status;
SELECT * FROM public.predictions LIMIT 0; -- Show schema
