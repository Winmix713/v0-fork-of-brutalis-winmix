-- Create helper functions for football match analysis
-- These functions will be used for calculating statistics and insights

-- Function to calculate team form (last N matches)
CREATE OR REPLACE FUNCTION calculate_team_form(
    team_name TEXT,
    num_matches INTEGER DEFAULT 5
) RETURNS DECIMAL AS $$
DECLARE
    form_score DECIMAL := 0;
    match_record RECORD;
    points INTEGER;
    match_count INTEGER := 0;
BEGIN
    -- Get last N matches for the team
    FOR match_record IN
        SELECT 
            home_team,
            away_team,
            full_time_home_goals,
            full_time_away_goals,
            match_time
        FROM matches 
        WHERE home_team = team_name OR away_team = team_name
        ORDER BY match_time DESC
        LIMIT num_matches
    LOOP
        match_count := match_count + 1;
        
        -- Calculate points for this match
        IF match_record.home_team = team_name THEN
            -- Team played at home
            IF match_record.full_time_home_goals > match_record.full_time_away_goals THEN
                points := 3; -- Win
            ELSIF match_record.full_time_home_goals = match_record.full_time_away_goals THEN
                points := 1; -- Draw
            ELSE
                points := 0; -- Loss
            END IF;
        ELSE
            -- Team played away
            IF match_record.full_time_away_goals > match_record.full_time_home_goals THEN
                points := 3; -- Win
            ELSIF match_record.full_time_away_goals = match_record.full_time_home_goals THEN
                points := 1; -- Draw
            ELSE
                points := 0; -- Loss
            END IF;
        END IF;
        
        form_score := form_score + points;
    END LOOP;
    
    -- Return average points per game
    IF match_count > 0 THEN
        RETURN form_score / match_count;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate head-to-head record
CREATE OR REPLACE FUNCTION get_h2h_record(
    team1 TEXT,
    team2 TEXT
) RETURNS TABLE(
    total_matches INTEGER,
    team1_wins INTEGER,
    team2_wins INTEGER,
    draws INTEGER,
    team1_goals INTEGER,
    team2_goals INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_matches,
        SUM(CASE 
            WHEN (home_team = team1 AND full_time_home_goals > full_time_away_goals) OR
                 (away_team = team1 AND full_time_away_goals > full_time_home_goals) 
            THEN 1 ELSE 0 
        END)::INTEGER as team1_wins,
        SUM(CASE 
            WHEN (home_team = team2 AND full_time_home_goals > full_time_away_goals) OR
                 (away_team = team2 AND full_time_away_goals > full_time_home_goals) 
            THEN 1 ELSE 0 
        END)::INTEGER as team2_wins,
        SUM(CASE 
            WHEN full_time_home_goals = full_time_away_goals 
            THEN 1 ELSE 0 
        END)::INTEGER as draws,
        SUM(CASE 
            WHEN home_team = team1 THEN full_time_home_goals 
            ELSE full_time_away_goals 
        END)::INTEGER as team1_goals,
        SUM(CASE 
            WHEN home_team = team2 THEN full_time_home_goals 
            ELSE full_time_away_goals 
        END)::INTEGER as team2_goals
    FROM matches 
    WHERE (home_team = team1 AND away_team = team2) OR 
          (home_team = team2 AND away_team = team1);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate comeback statistics
CREATE OR REPLACE FUNCTION calculate_comeback_stats(
    team_name TEXT
) RETURNS TABLE(
    total_matches INTEGER,
    comeback_wins INTEGER,
    comeback_draws INTEGER,
    blown_leads INTEGER,
    comeback_frequency DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_matches,
        SUM(CASE 
            WHEN (home_team = team_name AND half_time_home_goals < half_time_away_goals AND full_time_home_goals > full_time_away_goals) OR
                 (away_team = team_name AND half_time_away_goals < half_time_home_goals AND full_time_away_goals > full_time_home_goals)
            THEN 1 ELSE 0 
        END)::INTEGER as comeback_wins,
        SUM(CASE 
            WHEN (home_team = team_name AND half_time_home_goals < half_time_away_goals AND full_time_home_goals = full_time_away_goals) OR
                 (away_team = team_name AND half_time_away_goals < half_time_home_goals AND full_time_away_goals = full_time_home_goals)
            THEN 1 ELSE 0 
        END)::INTEGER as comeback_draws,
        SUM(CASE 
            WHEN (home_team = team_name AND half_time_home_goals > half_time_away_goals AND full_time_home_goals <= full_time_away_goals) OR
                 (away_team = team_name AND half_time_away_goals > half_time_home_goals AND full_time_away_goals <= full_time_home_goals)
            THEN 1 ELSE 0 
        END)::INTEGER as blown_leads,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (SUM(CASE 
                    WHEN (home_team = team_name AND half_time_home_goals < half_time_away_goals AND full_time_home_goals >= full_time_away_goals) OR
                         (away_team = team_name AND half_time_away_goals < half_time_home_goals AND full_time_away_goals >= full_time_home_goals)
                    THEN 1 ELSE 0 
                END)::DECIMAL / COUNT(*)::DECIMAL)
            ELSE 0
        END as comeback_frequency
    FROM matches 
    WHERE home_team = team_name OR away_team = team_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats(
    team_name TEXT
) RETURNS TABLE(
    total_matches INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    home_wins INTEGER,
    away_wins INTEGER,
    avg_goals_scored DECIMAL,
    avg_goals_conceded DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_matches,
        SUM(CASE 
            WHEN (home_team = team_name AND full_time_home_goals > full_time_away_goals) OR
                 (away_team = team_name AND full_time_away_goals > full_time_home_goals) 
            THEN 1 ELSE 0 
        END)::INTEGER as wins,
        SUM(CASE 
            WHEN full_time_home_goals = full_time_away_goals 
            THEN 1 ELSE 0 
        END)::INTEGER as draws,
        SUM(CASE 
            WHEN (home_team = team_name AND full_time_home_goals < full_time_away_goals) OR
                 (away_team = team_name AND full_time_away_goals < full_time_home_goals) 
            THEN 1 ELSE 0 
        END)::INTEGER as losses,
        SUM(CASE 
            WHEN home_team = team_name THEN full_time_home_goals 
            ELSE full_time_away_goals 
        END)::INTEGER as goals_for,
        SUM(CASE 
            WHEN home_team = team_name THEN full_time_away_goals 
            ELSE full_time_home_goals 
        END)::INTEGER as goals_against,
        SUM(CASE 
            WHEN home_team = team_name AND full_time_home_goals > full_time_away_goals 
            THEN 1 ELSE 0 
        END)::INTEGER as home_wins,
        SUM(CASE 
            WHEN away_team = team_name AND full_time_away_goals > full_time_home_goals 
            THEN 1 ELSE 0 
        END)::INTEGER as away_wins,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (SUM(CASE 
                    WHEN home_team = team_name THEN full_time_home_goals 
                    ELSE full_time_away_goals 
                END)::DECIMAL / COUNT(*)::DECIMAL)
            ELSE 0
        END as avg_goals_scored,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (SUM(CASE 
                    WHEN home_team = team_name THEN full_time_away_goals 
                    ELSE full_time_home_goals 
                END)::DECIMAL / COUNT(*)::DECIMAL)
            ELSE 0
        END as avg_goals_conceded
    FROM matches 
    WHERE home_team = team_name OR away_team = team_name;
END;
$$ LANGUAGE plpgsql;

-- Function to format match result
CREATE OR REPLACE FUNCTION format_match_result(
    home_goals INTEGER,
    away_goals INTEGER
) RETURNS TEXT AS $$
BEGIN
    RETURN home_goals || '-' || away_goals;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT 'Functions created successfully!' as status;

-- Example usage (uncomment to test):
-- SELECT * FROM calculate_comeback_stats('Barcelona');
-- SELECT * FROM get_h2h_record('Barcelona', 'Real Madrid');
-- SELECT calculate_team_form('Barcelona', 5);
