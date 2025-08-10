-- supabase/migrations/005_enhanced_predictions_table.sql
-- Enterprise-level SQL Migration: Consolidated and Optimized 'predictions' table.
-- This script provides the definitive, enhanced schema for the 'predictions' table,
-- incorporating all previous improvements, including Legend Mode specific fields,
-- robust indexing, data integrity, and RLS.
-- This serves as the final, comprehensive definition for the predictions table.

BEGIN; -- Start a transaction for atomicity

-- 1. Drop table if it exists (for clean recreation in development/testing environments)
--    In production, use ALTER TABLE if data needs to be preserved.
DROP TABLE IF EXISTS public.predictions CASCADE;

-- 2. Create 'predictions' table with all enhanced features
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
    
    -- Legend Mode specific fields
    comeback_probability_home NUMERIC(5,4) CHECK (comeback_probability_home >= 0 AND comeback_probability_home <= 1),
    comeback_probability_away NUMERIC(5,4) CHECK (comeback_probability_away >= 0 AND comeback_probability_away <= 1),
    resilience_factor_home NUMERIC(5,4) CHECK (resilience_factor_home >= 0 AND resilience_factor_home <= 1),
    resilience_factor_away NUMERIC(5,4) CHECK (resilience_factor_away >= 0 AND resilience_factor_away <= 1),
    mental_strength_home NUMERIC(5,4) CHECK (mental_strength_home >= 0 AND mental_strength_home <= 1),
    mental_strength_away NUMERIC(5,4) CHECK (mental_strength_away >= 0 AND mental_strength_away <= 1),
    legend_mode_features JSONB, -- Aggregated legend mode features for quick access
    
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

-- 5. Create trigger to automatically update 'updated_at' timestamp (reusing existing function)
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

-- 8. Create a function for automated cache cleanup (reusing existing function from 002)
--    NOTE: Scheduling should be done via Supabase Dashboard Cron Jobs or Edge Functions.
--    No cron.schedule call here.

-- 9. Create a view for prediction analysis (re-create to include new columns)
CREATE OR REPLACE VIEW public.prediction_analysis AS
SELECT
    p.*,
    CASE
        WHEN p.home_win_probability >= p.draw_probability AND p.home_win_probability >= p.away_win_probability THEN 'home_win'
        WHEN p.away_win_probability >= p.draw_probability AND p.away_win_probability >= p.home_win_probability THEN 'away_win'
        ELSE 'draw'
    END AS predicted_result
FROM
    public.predictions p;

-- 10. Create function to get prediction accuracy statistics (re-create to ensure it uses latest schema)
--     Explicitly drop existing functions to avoid "not unique" error
DROP FUNCTION IF EXISTS public.get_prediction_accuracy_stats(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.get_prediction_accuracy_stats() CASCADE; -- In case an older version existed without parameters

CREATE OR REPLACE FUNCTION public.get_prediction_accuracy_stats(
    model_type TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE(
    prediction_type TEXT,
    total_predictions BIGINT,
    correct_predictions BIGINT,
    accuracy_percentage NUMERIC(5,2),
    avg_confidence NUMERIC(5,4),
    avg_probability_accuracy NUMERIC(5,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.prediction_type,
        COUNT(*)::BIGINT AS total_predictions,
        SUM(CASE WHEN p.prediction_correct THEN 1 ELSE 0 END)::BIGINT AS correct_predictions,
        ROUND((SUM(CASE WHEN p.prediction_correct THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) AS accuracy_percentage,
        ROUND(AVG(p.confidence_score), 4) AS avg_confidence,
        ROUND(AVG(p.probability_accuracy), 4) AS avg_probability_accuracy
    FROM public.predictions p
    WHERE
        p.actual_result IS NOT NULL
        AND (model_type IS NULL OR p.prediction_type = model_type)
        AND (date_from IS NULL OR p.match_date >= date_from::DATE) -- Cast to DATE for comparison
        AND (date_to IS NULL OR p.match_date <= date_to::DATE)
    GROUP BY p.prediction_type
    ORDER BY accuracy_percentage DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to update enhanced predictions (can be scheduled via Supabase Cron Jobs)
CREATE OR REPLACE FUNCTION public.update_enhanced_predictions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    processed_count INTEGER := 0;
    match_record RECORD;
BEGIN
    -- Log start of update process
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('enhanced_predictions_update', 'Starting enhanced prediction update for upcoming matches.', NOW());

    -- Process upcoming matches (next 7 days) that don't have recent predictions
    FOR match_record IN
        SELECT m.id, m.home_team, m.away_team, m.match_time, m.league
        FROM public.matches m
        WHERE m.match_time BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND NOT EXISTS (
            SELECT 1 FROM public.predictions ep
            WHERE ep.match_id = m.id
            AND ep.prediction_type = 'ensemble' -- Check for ensemble predictions
            AND ep.predicted_at > NOW() - INTERVAL '1 day' -- Updated within the last day
        )
        ORDER BY m.match_time ASC
    LOOP
        BEGIN
            -- Call the feature calculation function
            -- This will also update/insert into the predictions table
            PERFORM public.calculate_features_for_match(
                match_record.id,
                90, -- Example: 90 days lookback for form/comeback
                10  -- Example: 10 H2H matches limit
            );

            -- Placeholder for actual ML model call or ensemble logic
            -- In a real scenario, you would call an external service or a more complex
            -- PL/pgSQL function that integrates ML model results.
            -- For now, we'll just update the prediction probabilities based on some logic
            -- or assume calculate_features_for_match already did a basic insert.

            -- Example: Update probabilities for the 'ensemble' type based on some logic
            UPDATE public.predictions
            SET
                prediction_type = 'ensemble',
                home_win_probability = 0.45, -- Replace with actual model output
                draw_probability = 0.25,
                away_win_probability = 0.30,
                predicted_home_goals = 2.1,
                predicted_away_goals = 1.8,
                predicted_total_goals = 3.9,
                confidence_score = 0.78,
                model_version = 'ensemble_v2.0',
                predicted_at = NOW(),
                expires_at = NOW() + INTERVAL '24 hours'
            WHERE
                match_id = match_record.id
                AND prediction_type = 'raw_features'; -- Update the raw features entry

            IF NOT FOUND THEN
                -- If no 'raw_features' prediction existed, insert a new ensemble one
                INSERT INTO public.predictions (
                    match_id, home_team, away_team, match_date, league, prediction_type,
                    home_win_probability, draw_probability, away_win_probability,
                    predicted_home_goals, predicted_away_goals, predicted_total_goals,
                    confidence_score, model_version, cache_key, predicted_at, expires_at
                ) VALUES (
                    match_record.id, match_record.home_team, match_record.away_team, match_record.match_time::DATE, match_record.league, 'ensemble',
                    0.45, 0.25, 0.30, -- Replace with actual model output
                    2.1, 1.8, 3.9,
                    0.78, 'ensemble_v2.0',
                    format('%s:%s:%s:%s', match_record.league, match_record.home_team, match_record.away_team, match_record.match_time::DATE),
                    NOW(), NOW() + INTERVAL '24 hours'
                ) ON CONFLICT (cache_key) DO UPDATE SET
                    prediction_type = EXCLUDED.prediction_type,
                    home_win_probability = EXCLUDED.home_win_probability,
                    draw_probability = EXCLUDED.draw_probability,
                    away_win_probability = EXCLUDED.away_win_probability,
                    predicted_home_goals = EXCLUDED.predicted_home_goals,
                    predicted_away_goals = EXCLUDED.predicted_away_goals,
                    predicted_total_goals = EXCLUDED.predicted_total_goals,
                    confidence_score = EXCLUDED.confidence_score,
                    model_version = EXCLUDED.model_version,
                    predicted_at = EXCLUDED.predicted_at,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW();
            END IF;

            processed_count := processed_count + 1;

        EXCEPTION
            WHEN OTHERS THEN
                -- Log any errors encountered for individual matches
                INSERT INTO public.system_logs (event_type, message, created_at, details)
                VALUES (
                    'enhanced_prediction_error',
                    format('Error processing enhanced prediction for match ID %s: %s', match_record.id, SQLERRM),
                    NOW(),
                    jsonb_build_object('match_id', match_record.id, 'error_sqlstate', SQLSTATE)
                );
        END;
    END LOOP;

    -- Log the execution completion
    INSERT INTO public.system_logs (event_type, message, created_at, details)
    VALUES (
        'enhanced_predictions_update',
        format('Completed enhanced prediction update. Processed %s matches.', processed_count),
        NOW(),
        jsonb_build_object('processed_count', processed_count)
    );
END;
$$;

-- Grant permissions for enhanced prediction functions
GRANT EXECUTE ON FUNCTION public.update_enhanced_predictions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_predictions() TO authenticated; -- Re-grant for clarity

-- 12. Insert some sample predictions for testing (only for development/testing)
--     Ensure match_id refers to an existing match in public.matches
INSERT INTO public.predictions (
    match_id, home_team, away_team, match_date, league, prediction_type,
    home_win_probability, draw_probability, away_win_probability,
    predicted_home_goals, predicted_away_goals, predicted_total_goals,
    confidence_score, model_version, features_used, cache_key, expires_at,
    comeback_probability_home, comeback_probability_away,
    resilience_factor_home, resilience_factor_away,
    mental_strength_home, mental_strength_away
) VALUES
(
    (SELECT id FROM public.matches WHERE home_team = 'Barcelona' AND away_team = 'Real Madrid' AND match_time::DATE = '2024-01-15' LIMIT 1),
    'Barcelona', 'Real Madrid', '2024-01-15', 'La Liga', 'ensemble',
    0.45, 0.25, 0.30, 2.1, 1.8, 3.9, 0.78, 'legend_v1.0',
    '{"form_features": {"avg_scored": 2.5}, "h2h_features": {"total_goals_avg": 3.2}}',
    'La Liga:barcelona:real madrid:2024-01-15', NOW() + INTERVAL '24 hours',
    0.15, 0.12, 0.82, 0.85, 0.88, 0.91
),
(
    (SELECT id FROM public.matches WHERE home_team = 'Valencia' AND away_team = 'Sevilla' AND match_time::DATE = '2024-01-14' LIMIT 1),
    'Valencia', 'Sevilla', '2024-01-14', 'La Liga', 'ensemble',
    0.38, 0.32, 0.30, 1.6, 1.4, 3.0, 0.65, 'legend_v1.0',
    '{"form_features": {"avg_scored": 1.8}, "h2h_features": {"total_goals_avg": 2.5}}',
    'La Liga:valencia:sevilla:2024-01-14', NOW() + INTERVAL '24 hours',
    0.22, 0.18, 0.71, 0.74, 0.69, 0.73
),
(
    (SELECT id FROM public.matches WHERE home_team = 'Athletic Bilbao' AND away_team = 'Villarreal' AND match_time::DATE = '2024-01-13' LIMIT 1),
    'Athletic Bilbao', 'Villarreal', '2024-01-13', 'La Liga', 'basic',
    0.42, 0.28, 0.30, 1.8, 1.5, 3.3, 0.72, 'basic_v1.0',
    '{"form_features": {"avg_scored": 2.0}}',
    'La Liga:athletic bilbao:villarreal:2024-01-13', NOW() + INTERVAL '24 hours',
    NULL, NULL, NULL, NULL, NULL, NULL
);

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Table public.predictions (enhanced) created successfully!' AS status, COUNT(*) AS sample_predictions FROM public.predictions;
SELECT id, home_team, away_team, prediction_type, confidence_score, model_version, cache_key FROM public.predictions ORDER BY id LIMIT 5;
SELECT * FROM public.get_prediction_accuracy_stats();
