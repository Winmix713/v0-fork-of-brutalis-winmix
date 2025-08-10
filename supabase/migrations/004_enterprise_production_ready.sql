-- supabase/migrations/004_enterprise_production_ready.sql
-- Enterprise-level SQL Migration: Legend Mode Deployment and Analytics Views.
-- This script creates advanced views and materialized views for in-depth match
-- analysis and prediction performance tracking, essential for the "Legend Mode"
-- and overall system monitoring.

BEGIN; -- Start a transaction

-- 1. Create a comprehensive view for match analysis, joining matches and predictions
--    This view provides a unified dataset for reporting and analytics.
CREATE OR REPLACE VIEW public.match_analysis_enterprise AS
SELECT
    m.id AS match_id,
    m.match_time,
    m.league, -- Corrected from p.league to m.league
    m.season,
    m.home_team,
    m.away_team,
    m.full_time_home_goals AS actual_home_goals,
    m.full_time_away_goals AS actual_away_goals,
    m.match_status,
    p.id AS prediction_id,
    p.prediction_type,
    p.home_win_probability,
    p.draw_probability,
    p.away_win_probability,
    p.predicted_home_goals,
    p.predicted_away_goals,
    p.confidence_score,
    p.model_version,
    p.predicted_at,
    p.actual_result,
    p.prediction_correct,
    p.probability_accuracy,
    p.comeback_probability_home,
    p.comeback_probability_away,
    p.resilience_factor_home,
    p.resilience_factor_away,
    p.mental_strength_home,
    p.mental_strength_away,
    -- Calculated fields for analysis
    CASE
        WHEN m.full_time_home_goals > m.full_time_away_goals THEN 'home_win'
        WHEN m.full_time_home_goals < m.full_time_away_goals THEN 'away_win'
        ELSE 'draw'
    END AS actual_outcome,
    CASE
        WHEN p.home_win_probability >= p.draw_probability AND p.home_win_probability >= p.away_win_probability THEN 'home_win'
        WHEN p.away_win_probability >= p.draw_probability AND p.away_win_probability >= p.home_win_probability THEN 'away_win'
        ELSE 'draw'
    END AS predicted_outcome,
    -- Goal difference for actual and predicted
    (m.full_time_home_goals - m.full_time_away_goals) AS actual_goal_diff,
    (p.predicted_home_goals - p.predicted_away_goals) AS predicted_goal_diff
FROM
    public.matches m
LEFT JOIN
    public.predictions p ON m.id = p.match_id
WHERE
    m.match_time >= '2023-01-01' -- Example: Enterprise data retention policy
ORDER BY
    m.match_time DESC;

-- 2. Create a materialized view for performance (enterprise requirement for heavy analytics)
--    Materialized views pre-compute results, offering faster query performance at the cost of refresh latency.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.match_analysis_materialized AS
SELECT * FROM public.match_analysis_enterprise;

-- Add indexes to the materialized view for query performance
CREATE INDEX IF NOT EXISTS idx_match_analysis_mat_date ON public.match_analysis_materialized (match_time DESC);
CREATE INDEX IF NOT EXISTS idx_match_analysis_mat_league ON public.match_analysis_materialized (league);
CREATE INDEX IF NOT EXISTS idx_match_analysis_mat_teams ON public.match_analysis_materialized (home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_match_analysis_mat_prediction_correct ON public.match_analysis_materialized (prediction_correct) WHERE prediction_correct IS NOT NULL;

-- 3. Create a function to refresh the materialized view
--    This function will be called periodically (e.g., via Supabase Cron Job) to update the view.
CREATE OR REPLACE FUNCTION public.refresh_match_analysis_materialized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Use SECURITY DEFINER to allow function to refresh the view
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.match_analysis_materialized;
    -- Log the refresh operation
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('materialized_view_refresh', 'Match analysis materialized view refreshed', NOW());
END;
$$;

-- 4. Grant appropriate permissions (enterprise security)
GRANT SELECT ON public.match_analysis_enterprise TO authenticated;
GRANT SELECT ON public.match_analysis_materialized TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_match_analysis_materialized() TO authenticated; -- Or specific role for cron job

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Legend Mode deployment and analytics views created successfully!' AS status;
SELECT * FROM public.match_analysis_enterprise LIMIT 5;
SELECT * FROM public.match_analysis_materialized LIMIT 5;
