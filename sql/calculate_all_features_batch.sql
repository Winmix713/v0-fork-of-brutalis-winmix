-- sql/calculate_all_features_batch.sql
-- Enterprise-level SQL: Batch Feature Calculation for Football Matches.
-- This script defines functions to calculate various statistical features for matches,
-- which are crucial for machine learning models. It supports both individual match
-- feature calculation and batch processing.

BEGIN; -- Start a transaction

-- 1. Function to calculate features for a single match
--    This function takes a match ID and returns a JSONB object of calculated features.
CREATE OR REPLACE FUNCTION public.calculate_features_for_match(
    p_match_id INTEGER,
    p_lookback_days INTEGER DEFAULT 30,
    p_h2h_matches_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_home_team TEXT;
    v_away_team TEXT;
    v_league TEXT;
    v_match_time TIMESTAMPTZ;
    v_features JSONB := '{}';
    v_team_form_home JSONB;
    v_team_form_away JSONB;
    v_h2h_stats JSONB;
    v_comeback_stats_home JSONB;
    v_comeback_stats_away JSONB;
BEGIN
    -- Retrieve match details
    SELECT home_team, away_team, league, match_time
    INTO v_home_team, v_away_team, v_league, v_match_time
    FROM public.matches
    WHERE id = p_match_id;

    IF v_home_team IS NULL THEN
        RAISE EXCEPTION 'Match with ID % not found.', p_match_id;
    END IF;

    -- Get home team form stats
    SELECT to_jsonb(t) INTO v_team_form_home
    FROM public.get_team_form_stats(v_home_team, v_league, v_match_time, p_lookback_days) AS t;
    v_features := jsonb_set(v_features, '{home_team_form}', v_team_form_home, true);

    -- Get away team form stats
    SELECT to_jsonb(t) INTO v_team_form_away
    FROM public.get_team_form_stats(v_away_team, v_league, v_match_time, p_lookback_days) AS t;
    v_features := jsonb_set(v_features, '{away_team_form}', v_team_form_away, true);

    -- Get head-to-head stats
    SELECT to_jsonb(t) INTO v_h2h_stats
    FROM public.get_h2h_stats(v_home_team, v_away_team, v_match_time, p_h2h_matches_limit) AS t;
    v_features := jsonb_set(v_features, '{h2h_stats}', v_h2h_stats, true);

    -- Get comeback stats for home team
    SELECT to_jsonb(t) INTO v_comeback_stats_home
    FROM public.get_comeback_stats(v_home_team, p_lookback_days) AS t;
    v_features := jsonb_set(v_features, '{home_comeback_stats}', v_comeback_stats_home, true);

    -- Get comeback stats for away team
    SELECT to_jsonb(t) INTO v_comeback_stats_away
    FROM public.get_comeback_stats(v_away_team, p_lookback_days) AS t;
    v_features := jsonb_set(v_features, '{away_comeback_stats}', v_comeback_stats_away, true);

    RETURN v_features;
END;
$$;

-- 2. Function to calculate features for a batch of matches
--    This function iterates through recent matches and calculates/updates their features.
CREATE OR REPLACE FUNCTION public.calculate_all_features_batch(
    p_days_lookback INTEGER DEFAULT 7, -- How many days back to look for matches to process
    p_form_lookback_days INTEGER DEFAULT 30,
    p_h2h_matches_limit INTEGER DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Use SECURITY DEFINER to allow function to update tables it might not have direct user permissions for
AS $$
DECLARE
    r RECORD;
    v_features JSONB;
    v_processed_count INTEGER := 0;
BEGIN
    -- Log start of batch process
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('feature_calculation_batch', 'Starting batch feature calculation for recent matches.', NOW());

    FOR r IN
        SELECT id, home_team, away_team, match_time, league
        FROM public.matches
        WHERE match_time >= (NOW() - INTERVAL '1 day' * p_days_lookback)
        ORDER BY match_time DESC
    LOOP
        BEGIN
            -- Calculate features for the current match
            v_features := public.calculate_features_for_match(
                r.id,
                p_form_lookback_days,
                p_h2h_matches_limit
            );

            -- Update the predictions table with the new features
            -- Assuming 'predictions' table has a 'features_used' JSONB column
            -- This will update existing predictions or insert new ones if needed.
            -- For a more robust solution, consider a dedicated 'match_features' table.
            UPDATE public.predictions
            SET
                features_used = v_features,
                updated_at = NOW()
            WHERE
                match_id = r.id;

            IF NOT FOUND THEN
                -- If no prediction exists for this match, insert a new one with features
                -- This is a simplified insert; actual prediction logic would be more complex.
                INSERT INTO public.predictions (
                    match_id, home_team, away_team, match_date, league, prediction_type,
                    home_win_probability, draw_probability, away_win_probability,
                    confidence_score, model_version, features_used, cache_key, predicted_at
                ) VALUES (
                    r.id, r.home_team, r.away_team, r.match_time::DATE, r.league, 'raw_features',
                    0.33, 0.33, 0.34, -- Placeholder probabilities
                    0.5, 'feature_extractor_v1', v_features,
                    format('%s:%s:%s:%s', r.league, r.home_team, r.away_team, r.match_time::DATE),
                    NOW()
                ) ON CONFLICT (cache_key) DO UPDATE SET
                    features_used = EXCLUDED.features_used,
                    updated_at = NOW();
            END IF;

            v_processed_count := v_processed_count + 1;

        EXCEPTION
            WHEN OTHERS THEN
                -- Log any errors encountered for individual matches
                INSERT INTO public.system_logs (event_type, message, created_at, details)
                VALUES (
                    'feature_calculation_error',
                    format('Error processing match ID %s: %s', r.id, SQLERRM),
                    NOW(),
                    jsonb_build_object('match_id', r.id, 'error_sqlstate', SQLSTATE)
                );
        END;
    END LOOP;

    -- Log end of batch process
    INSERT INTO public.system_logs (event_type, message, created_at, details)
    VALUES (
        'feature_calculation_batch',
        format('Completed batch feature calculation. Processed %s matches.', v_processed_count),
        NOW(),
        jsonb_build_object('processed_count', v_processed_count)
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.calculate_features_for_match(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_all_features_batch(INTEGER, INTEGER, INTEGER) TO authenticated;
-- Grant usage on sequences if SERIAL is used for IDs and functions interact with them
GRANT USAGE ON SEQUENCE public.predictions_id_seq TO authenticated;

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Batch feature calculation functions created successfully!' AS status;
-- Example usage:
-- SELECT public.calculate_features_for_match(1); -- Replace 1 with an actual match ID
-- SELECT public.calculate_all_features_batch(7); -- Process matches from the last 7 days
