-- sql/legend_mode_comeback_breakdown.sql
-- Enterprise-level SQL: Legend Mode Comeback Breakdown Analysis.
-- This script provides a detailed analysis of a team's comeback and blown lead statistics,
-- crucial for the "Legend Mode" feature. It defines a function that returns a JSONB
-- object containing various comeback-related metrics.

BEGIN; -- Start a transaction

-- 1. Function to get comeback/blown lead statistics for a team, returning JSONB
CREATE OR REPLACE FUNCTION public.get_legend_mode_comeback_stats(
    p_team_name TEXT,
    p_lookback_days INTEGER DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_matches_in_period BIGINT;
    v_total_comebacks BIGINT;
    v_total_blown_leads BIGINT;
    v_comeback_attempts BIGINT;
    v_blown_lead_attempts BIGINT;
    v_comeback_success_rate NUMERIC(5,2);
    v_blown_lead_rate NUMERIC(5,2);
    v_avg_comeback_goal_diff NUMERIC(5,2);
    v_avg_blown_lead_goal_diff NUMERIC(5,2);
    v_resilience_factor NUMERIC(5,4);
    v_mental_strength_factor NUMERIC(5,4);
BEGIN
    WITH TeamMatches AS (
        SELECT
            id,
            match_time,
            home_team,
            away_team,
            half_time_home_goals,
            half_time_away_goals,
            full_time_home_goals,
            full_time_away_goals
        FROM
            public.matches
        WHERE
            (home_team = p_team_name OR away_team = p_team_name)
            AND match_time >= (NOW() - INTERVAL '1 day' * p_lookback_days)
    ),
    ComebackAnalysis AS (
        SELECT
            tm.id,
            -- Determine if it was a comeback for the analyzed team
            CASE
                WHEN tm.home_team = p_team_name AND tm.half_time_home_goals < tm.half_time_away_goals AND tm.full_time_home_goals > tm.full_time_away_goals THEN TRUE
                WHEN tm.away_team = p_team_name AND tm.half_time_away_goals < tm.half_time_home_goals AND tm.full_time_away_goals > tm.full_time_home_goals THEN TRUE
                ELSE FALSE
            END AS is_comeback,
            -- Determine if the analyzed team blew a lead
            CASE
                WHEN tm.home_team = p_team_name AND tm.half_time_home_goals > tm.half_time_away_goals AND tm.full_time_home_goals < tm.full_time_away_goals THEN TRUE
                WHEN tm.away_team = p_team_name AND tm.half_time_away_goals > tm.half_time_home_goals AND tm.full_time_away_goals < tm.full_time_home_goals THEN TRUE
                ELSE FALSE
            END AS is_blown_lead,
            -- Half-time goal difference for the analyzed team
            CASE
                WHEN tm.home_team = p_team_name THEN tm.half_time_home_goals - tm.half_time_away_goals
                ELSE tm.half_time_away_goals - tm.half_time_home_goals
            END AS half_time_goal_diff,
            -- Full-time goal difference for the analyzed team
            CASE
                WHEN tm.home_team = p_team_name THEN tm.full_time_home_goals - tm.full_time_away_goals
                ELSE tm.full_time_away_goals - tm.full_time_home_goals
            END AS full_time_goal_diff
        FROM
            TeamMatches tm
    )
    SELECT
        COUNT(id)::BIGINT,
        SUM(CASE WHEN is_comeback THEN 1 ELSE 0 END)::BIGINT,
        SUM(CASE WHEN is_blown_lead THEN 1 ELSE 0 END)::BIGINT,
        COUNT(CASE WHEN half_time_goal_diff < 0 THEN 1 ELSE 0 END)::BIGINT, -- Comeback attempts
        COUNT(CASE WHEN half_time_goal_diff > 0 THEN 1 ELSE 0 END)::BIGINT, -- Blown lead attempts
        ROUND(
            (SUM(CASE WHEN is_comeback THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff < 0 THEN 1 ELSE 0 END), 0)) * 100, 2
        )::NUMERIC(5,2),
        ROUND(
            (SUM(CASE WHEN is_blown_lead THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff > 0 THEN 1 ELSE 0 END), 0)) * 100, 2
        )::NUMERIC(5,2),
        ROUND(
            AVG(CASE WHEN is_comeback THEN ABS(half_time_goal_diff) ELSE NULL END), 2
        )::NUMERIC(5,2),
        ROUND(
            AVG(CASE WHEN is_blown_lead THEN ABS(half_time_goal_diff) ELSE NULL END), 2
        )::NUMERIC(5,2),
        ROUND(
            (SUM(CASE WHEN half_time_goal_diff < 0 AND full_time_goal_diff >= 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff < 0 THEN 1 ELSE 0 END), 0)), 4
        )::NUMERIC(5,4),
        ROUND(
            (SUM(CASE WHEN half_time_goal_diff > 0 AND full_time_goal_diff >= 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff > 0 THEN 1 ELSE 0 END), 0)), 4
        )::NUMERIC(5,4)
    INTO
        v_total_matches_in_period,
        v_total_comebacks,
        v_total_blown_leads,
        v_comeback_attempts,
        v_blown_lead_attempts,
        v_comeback_success_rate,
        v_blown_lead_rate,
        v_avg_comeback_goal_diff,
        v_avg_blown_lead_goal_diff,
        v_resilience_factor,
        v_mental_strength_factor
    FROM
        ComebackAnalysis;

    RETURN jsonb_build_object(
        'team_name', p_team_name,
        'lookback_days', p_lookback_days,
        'total_matches_in_period', v_total_matches_in_period,
        'total_comebacks', v_total_comebacks,
        'total_blown_leads', v_total_blown_leads,
        'comeback_attempts', v_comeback_attempts,
        'blown_lead_attempts', v_blown_lead_attempts,
        'comeback_success_rate', v_comeback_success_rate,
        'blown_lead_rate', v_blown_lead_rate,
        'avg_comeback_goal_diff', v_avg_comeback_goal_diff,
        'avg_blown_lead_goal_diff', v_avg_blown_lead_goal_diff,
        'resilience_factor', v_resilience_factor,
        'mental_strength_factor', v_mental_strength_factor
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_legend_mode_comeback_stats(TEXT, INTEGER) TO authenticated;

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Legend Mode comeback breakdown function created successfully!' AS status;
-- Example usage:
-- SELECT public.get_legend_mode_comeback_stats('Barcelona', 90);
