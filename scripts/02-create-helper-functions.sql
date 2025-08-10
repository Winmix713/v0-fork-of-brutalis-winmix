-- scripts/02-create-helper-functions.sql
-- Enterprise-level SQL: Helper Functions for Football Statistics.
-- This script creates reusable PL/pgSQL functions to calculate team statistics,
-- head-to-head records, and comeback statistics.
-- These functions enhance modularity, reusability, and maintainability of database logic.

BEGIN; -- Start a transaction

-- 1. Function to get team form statistics
CREATE OR REPLACE FUNCTION public.get_team_form_stats(
    p_team_name TEXT,
    p_league TEXT,
    p_match_time TIMESTAMPTZ,
    p_lookback_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    matches_played BIGINT,
    avg_goals_scored NUMERIC(5,2),
    avg_goals_conceded NUMERIC(5,2),
    wins BIGINT,
    draws BIGINT,
    losses BIGINT,
    avg_shots NUMERIC(5,2),
    avg_shots_on_target NUMERIC(5,2),
    avg_corners NUMERIC(5,2),
    avg_yellow_cards NUMERIC(5,2),
    avg_red_cards NUMERIC(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(m.id) AS matches_played,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.full_time_home_goals ELSE m.full_time_away_goals END)::NUMERIC(5,2) AS avg_goals_scored,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.full_time_away_goals ELSE m.full_time_home_goals END)::NUMERIC(5,2) AS avg_goals_conceded,
        SUM(CASE WHEN (m.home_team = p_team_name AND m.full_time_home_goals > m.full_time_away_goals) OR (m.away_team = p_team_name AND m.full_time_away_goals > m.full_time_home_goals) THEN 1 ELSE 0 END)::BIGINT AS wins,
        SUM(CASE WHEN m.full_time_home_goals = m.full_time_away_goals THEN 1 ELSE 0 END)::BIGINT AS draws,
        SUM(CASE WHEN (m.home_team = p_team_name AND m.full_time_home_goals < m.full_time_away_goals) OR (m.away_team = p_team_name AND m.full_time_away_goals < m.full_time_home_goals) THEN 1 ELSE 0 END)::BIGINT AS losses,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.home_shots ELSE m.away_shots END)::NUMERIC(5,2) AS avg_shots,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.home_shots_on_target ELSE m.away_shots_on_target END)::NUMERIC(5,2) AS avg_shots_on_target,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.home_corners ELSE m.away_corners END)::NUMERIC(5,2) AS avg_corners,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.home_yellow_cards ELSE m.away_yellow_cards END)::NUMERIC(5,2) AS avg_yellow_cards,
        AVG(CASE WHEN m.home_team = p_team_name THEN m.home_red_cards ELSE m.away_red_cards END)::NUMERIC(5,2) AS avg_red_cards
    FROM
        public.matches m
    WHERE
        (m.home_team = p_team_name OR m.away_team = p_team_name)
        AND m.match_time < p_match_time
        AND m.match_time >= (p_match_time - INTERVAL '1 day' * p_lookback_days)
        AND m.league = p_league;
END;
$$;

-- 2. Function to get head-to-head statistics
CREATE OR REPLACE FUNCTION public.get_h2h_stats(
    p_team1_name TEXT,
    p_team2_name TEXT,
    p_match_time TIMESTAMPTZ,
    p_h2h_matches_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    h2h_matches_played BIGINT,
    h2h_team1_wins BIGINT,
    h2h_team2_wins BIGINT,
    h2h_draws BIGINT,
    h2h_avg_total_goals NUMERIC(5,2),
    h2h_avg_team1_goals NUMERIC(5,2),
    h2h_avg_team2_goals NUMERIC(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH H2HMatches AS (
        SELECT
            m.id,
            m.home_team,
            m.away_team,
            m.full_time_home_goals,
            m.full_time_away_goals
        FROM
            public.matches m
        WHERE
            (m.home_team = p_team1_name AND m.away_team = p_team2_name)
            OR (m.home_team = p_team2_name AND m.away_team = p_team1_name)
            AND m.match_time < p_match_time
        ORDER BY
            m.match_time DESC
        LIMIT p_h2h_matches_limit
    )
    SELECT
        COUNT(h.id)::BIGINT AS h2h_matches_played,
        SUM(CASE WHEN (h.home_team = p_team1_name AND h.full_time_home_goals > h.full_time_away_goals) OR (h.away_team = p_team1_name AND h.full_time_away_goals > h.full_time_home_goals) THEN 1 ELSE 0 END)::BIGINT AS h2h_team1_wins,
        SUM(CASE WHEN (h.home_team = p_team2_name AND h.full_time_home_goals > h.full_time_away_goals) OR (h.away_team = p_team2_name AND h.full_time_away_goals > h.full_time_home_goals) THEN 1 ELSE 0 END)::BIGINT AS h2h_team2_wins,
        SUM(CASE WHEN h.full_time_home_goals = h.full_time_away_goals THEN 1 ELSE 0 END)::BIGINT AS h2h_draws,
        AVG(h.full_time_home_goals + h.full_time_away_goals)::NUMERIC(5,2) AS h2h_avg_total_goals,
        AVG(CASE WHEN h.home_team = p_team1_name THEN h.full_time_home_goals ELSE h.full_time_away_goals END)::NUMERIC(5,2) AS h2h_avg_team1_goals,
        AVG(CASE WHEN h.home_team = p_team2_name THEN h.full_time_home_goals ELSE h.full_time_away_goals END)::NUMERIC(5,2) AS h2h_avg_team2_goals
    FROM
        H2HMatches h;
END;
$$;

-- 3. Function to get comeback/blown lead statistics for a team
-- NOTE: This function is similar to get_legend_mode_comeback_stats but returns a TABLE,
-- while get_legend_mode_comeback_stats returns JSONB.
-- Keeping both for now, but consider consolidating if functionality overlaps.
CREATE OR REPLACE FUNCTION public.get_comeback_stats(
    p_team_name TEXT,
    p_lookback_days INTEGER DEFAULT 90
)
RETURNS TABLE(
    total_matches_in_period BIGINT,
    total_comebacks BIGINT,
    total_blown_leads BIGINT,
    comeback_success_rate NUMERIC(5,2),
    blown_lead_rate NUMERIC(5,2),
    avg_comeback_goal_diff NUMERIC(5,2),
    avg_blown_lead_goal_diff NUMERIC(5,2),
    resilience_factor NUMERIC(5,4),
    mental_strength_factor NUMERIC(5,4)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
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
        COUNT(id)::BIGINT AS total_matches_in_period,
        SUM(CASE WHEN is_comeback THEN 1 ELSE 0 END)::BIGINT AS total_comebacks,
        SUM(CASE WHEN is_blown_lead THEN 1 ELSE 0 END)::BIGINT AS total_blown_leads,
        ROUND(
            (SUM(CASE WHEN is_comeback THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff < 0 THEN 1 ELSE 0 END), 0)) * 100, 2
        )::NUMERIC(5,2) AS comeback_success_rate,
        ROUND(
            (SUM(CASE WHEN is_blown_lead THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff > 0 THEN 1 ELSE 0 END), 0)) * 100, 2
        )::NUMERIC(5,2) AS blown_lead_rate,
        ROUND(
            AVG(CASE WHEN is_comeback THEN ABS(half_time_goal_diff) ELSE NULL END), 2
        )::NUMERIC(5,2) AS avg_comeback_goal_diff,
        ROUND(
            AVG(CASE WHEN is_blown_lead THEN ABS(half_time_goal_diff) ELSE NULL END), 2
        )::NUMERIC(5,2) AS avg_blown_lead_goal_diff,
        ROUND(
            (SUM(CASE WHEN half_time_goal_diff < 0 AND full_time_goal_diff >= 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff < 0 THEN 1 ELSE 0 END), 0)), 4
        )::NUMERIC(5,4) AS resilience_factor,
        ROUND(
            (SUM(CASE WHEN half_time_goal_diff > 0 AND full_time_goal_diff >= 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(CASE WHEN half_time_goal_diff > 0 THEN 1 ELSE 0 END), 0)), 4
        )::NUMERIC(5,4) AS mental_strength_factor
    FROM
        ComebackAnalysis;
END;
$$;

COMMIT; -- End the transaction

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_team_form_stats(TEXT, TEXT, TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_h2h_stats(TEXT, TEXT, TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_comeback_stats(TEXT, INTEGER) TO authenticated;

-- Verification (for development/testing)
SELECT 'Helper functions created successfully!' AS status;
-- Example usage:
-- SELECT * FROM public.get_team_form_stats('Barcelona', 'La Liga', '2024-01-15 15:00:00+00', 30);
-- SELECT * FROM public.get_h2h_stats('Barcelona', 'Real Madrid', '2024-01-15 15:00:00+00', 5);
-- SELECT * FROM public.get_comeback_stats('Barcelona', 90);
