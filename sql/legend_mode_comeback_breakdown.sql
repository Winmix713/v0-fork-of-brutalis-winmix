-- LEGEND MODE: Comeback Frequency Breakdown
-- Enhanced batch SQL with detailed comeback patterns
WITH
-- Enhanced home team analysis with comeback patterns
home_matches_detailed AS (
  SELECT
    m.*,
    (CASE WHEN lower(m.home_team) = lower(:home_team) THEN 'home' ELSE 'away' END) AS perspective,
    -- Comeback scenarios
    CASE 
      WHEN (lower(m.home_team) = lower(:home_team) AND halftime_home < halftime_away AND fulltime_home > fulltime_away)
        OR (lower(m.away_team) = lower(:home_team) AND halftime_away < halftime_home AND fulltime_away > fulltime_home)
      THEN 'comeback_win'
      WHEN (lower(m.home_team) = lower(:home_team) AND halftime_home < halftime_away AND fulltime_home = fulltime_away)
        OR (lower(m.away_team) = lower(:home_team) AND halftime_away < halftime_home AND fulltime_away = fulltime_home)
      THEN 'comeback_draw'
      WHEN (lower(m.home_team) = lower(:home_team) AND halftime_home > halftime_away AND fulltime_home < fulltime_away)
        OR (lower(m.away_team) = lower(:home_team) AND halftime_away > halftime_home AND fulltime_away < fulltime_home)
      THEN 'blown_lead_loss'
      WHEN (lower(m.home_team) = lower(:home_team) AND halftime_home > halftime_away AND fulltime_home = fulltime_away)
        OR (lower(m.away_team) = lower(:home_team) AND halftime_away > halftime_home AND fulltime_away = fulltime_home)
      THEN 'blown_lead_draw'
      ELSE 'normal'
    END AS comeback_pattern,
    -- Goal difference analysis
    ABS((CASE WHEN lower(m.home_team) = lower(:home_team) THEN halftime_home - halftime_away ELSE halftime_away - halftime_home END)) AS ht_goal_diff,
    ABS((CASE WHEN lower(m.home_team) = lower(:home_team) THEN fulltime_home - fulltime_away ELSE fulltime_away - fulltime_home END)) AS ft_goal_diff
  FROM matches m
  WHERE m.league = :league AND (lower(m.home_team) = lower(:home_team) OR lower(m.away_team) = lower(:home_team))
  ORDER BY m.match_date DESC
  LIMIT 50
),

-- Enhanced away team analysis
away_matches_detailed AS (
  SELECT
    m.*,
    (CASE WHEN lower(m.home_team) = lower(:away_team) THEN 'home' ELSE 'away' END) AS perspective,
    CASE 
      WHEN (lower(m.home_team) = lower(:away_team) AND halftime_home < halftime_away AND fulltime_home > fulltime_away)
        OR (lower(m.away_team) = lower(:away_team) AND halftime_away < halftime_home AND fulltime_away > fulltime_home)
      THEN 'comeback_win'
      WHEN (lower(m.home_team) = lower(:away_team) AND halftime_home < halftime_away AND fulltime_home = fulltime_away)
        OR (lower(m.away_team) = lower(:away_team) AND halftime_away < halftime_home AND fulltime_away = fulltime_home)
      THEN 'comeback_draw'
      WHEN (lower(m.home_team) = lower(:away_team) AND halftime_home > halftime_away AND fulltime_home < fulltime_away)
        OR (lower(m.away_team) = lower(:away_team) AND halftime_away > halftime_home AND fulltime_away < fulltime_home)
      THEN 'blown_lead_loss'
      WHEN (lower(m.home_team) = lower(:away_team) AND halftime_home > halftime_away AND fulltime_home = fulltime_away)
        OR (lower(m.away_team) = lower(:away_team) AND halftime_away > halftime_home AND fulltime_away = fulltime_home)
      THEN 'blown_lead_draw'
      ELSE 'normal'
    END AS comeback_pattern,
    ABS((CASE WHEN lower(m.home_team) = lower(:away_team) THEN halftime_home - halftime_away ELSE halftime_away - halftime_home END)) AS ht_goal_diff,
    ABS((CASE WHEN lower(m.home_team) = lower(:away_team) THEN fulltime_home - fulltime_away ELSE fulltime_away - fulltime_home END)) AS ft_goal_diff
  FROM matches m
  WHERE m.league = :league AND (lower(m.home_team) = lower(:away_team) OR lower(m.away_team) = lower(:away_team))
  ORDER BY m.match_date DESC
  LIMIT 50
),

-- LEGEND MODE: Comeback frequency breakdown
home_comeback_breakdown AS (
  SELECT
    COUNT(*) AS total_matches,
    -- Comeback patterns
    COUNT(*) FILTER (WHERE comeback_pattern = 'comeback_win') AS comeback_wins,
    COUNT(*) FILTER (WHERE comeback_pattern = 'comeback_draw') AS comeback_draws,
    COUNT(*) FILTER (WHERE comeback_pattern = 'blown_lead_loss') AS blown_lead_losses,
    COUNT(*) FILTER (WHERE comeback_pattern = 'blown_lead_draw') AS blown_lead_draws,
    COUNT(*) FILTER (WHERE comeback_pattern = 'normal') AS normal_matches,
    
    -- Comeback by goal difference
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff = 1) AS comeback_1goal,
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff = 2) AS comeback_2goal,
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff >= 3) AS comeback_3plus_goal,
    
    -- Time-based patterns (recent form)
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw')) AS total_comebacks,
    
    -- Advanced metrics
    AVG(CASE WHEN comeback_pattern = 'comeback_win' THEN ft_goal_diff ELSE NULL END) AS avg_comeback_margin,
    MAX(CASE WHEN comeback_pattern IN ('comeback_win', 'comeback_draw') THEN ht_goal_diff ELSE 0 END) AS max_comeback_deficit
  FROM home_matches_detailed
),

away_comeback_breakdown AS (
  SELECT
    COUNT(*) AS total_matches,
    COUNT(*) FILTER (WHERE comeback_pattern = 'comeback_win') AS comeback_wins,
    COUNT(*) FILTER (WHERE comeback_pattern = 'comeback_draw') AS comeback_draws,
    COUNT(*) FILTER (WHERE comeback_pattern = 'blown_lead_loss') AS blown_lead_losses,
    COUNT(*) FILTER (WHERE comeback_pattern = 'blown_lead_draw') AS blown_lead_draws,
    COUNT(*) FILTER (WHERE comeback_pattern = 'normal') AS normal_matches,
    
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff = 1) AS comeback_1goal,
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff = 2) AS comeback_2goal,
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw') AND ht_goal_diff >= 3) AS comeback_3plus_goal,
    
    COUNT(*) FILTER (WHERE comeback_pattern IN ('comeback_win', 'comeback_draw')) AS total_comebacks,
    
    AVG(CASE WHEN comeback_pattern = 'comeback_win' THEN ft_goal_diff ELSE NULL END) AS avg_comeback_margin,
    MAX(CASE WHEN comeback_pattern IN ('comeback_win', 'comeback_draw') THEN ht_goal_diff ELSE 0 END) AS max_comeback_deficit
  FROM away_matches_detailed
),

-- Enhanced H2H with comeback patterns
h2h_comeback_analysis AS (
  SELECT
    COUNT(*) AS total_matches,
    COUNT(*) FILTER (WHERE 
      (lower(home_team) = lower(:home_team) AND halftime_home < halftime_away AND fulltime_home >= fulltime_away)
      OR (lower(away_team) = lower(:home_team) AND halftime_away < halftime_home AND fulltime_away >= fulltime_home)
    ) AS home_team_comebacks,
    COUNT(*) FILTER (WHERE 
      (lower(home_team) = lower(:away_team) AND halftime_home < halftime_away AND fulltime_home >= fulltime_away)
      OR (lower(away_team) = lower(:away_team) AND halftime_away < halftime_home AND fulltime_away >= fulltime_home)
    ) AS away_team_comebacks,
    AVG(ABS(halftime_home - halftime_away)) AS avg_ht_goal_diff,
    AVG(ABS(fulltime_home - fulltime_away)) AS avg_ft_goal_diff
  FROM matches m
  WHERE m.league = :league
    AND (
      (lower(m.home_team) = lower(:home_team) AND lower(m.away_team) = lower(:away_team))
      OR (lower(m.home_team) = lower(:away_team) AND lower(m.away_team) = lower(:home_team))
    )
  ORDER BY m.match_date DESC
  LIMIT 20
)

-- LEGEND MODE JSON OUTPUT
SELECT json_build_object(
  'home', json_build_object(
    'basic_stats', json_build_object(
      'total_matches', hcb.total_matches,
      'form_index', CASE WHEN hcb.total_matches > 0 THEN round((hcb.comeback_wins * 3 + hcb.comeback_draws)::numeric / (hcb.total_matches * 3), 3) ELSE 0 END
    ),
    'comeback_breakdown', json_build_object(
      'comeback_wins', hcb.comeback_wins,
      'comeback_draws', hcb.comeback_draws,
      'total_comebacks', hcb.total_comebacks,
      'comeback_frequency', CASE WHEN hcb.total_matches > 0 THEN round(hcb.total_comebacks::numeric / hcb.total_matches, 3) ELSE 0 END,
      'comeback_success_rate', CASE WHEN hcb.total_comebacks > 0 THEN round(hcb.comeback_wins::numeric / hcb.total_comebacks, 3) ELSE 0 END
    ),
    'comeback_by_deficit', json_build_object(
      'from_1goal', hcb.comeback_1goal,
      'from_2goal', hcb.comeback_2goal,
      'from_3plus_goal', hcb.comeback_3plus_goal,
      'max_deficit_overcome', hcb.max_comeback_deficit
    ),
    'blown_leads', json_build_object(
      'blown_lead_losses', hcb.blown_lead_losses,
      'blown_lead_draws', hcb.blown_lead_draws,
      'blown_lead_frequency', CASE WHEN hcb.total_matches > 0 THEN round((hcb.blown_lead_losses + hcb.blown_lead_draws)::numeric / hcb.total_matches, 3) ELSE 0 END
    ),
    'mental_strength', json_build_object(
      'avg_comeback_margin', round(COALESCE(hcb.avg_comeback_margin, 0)::numeric, 2),
      'resilience_score', CASE WHEN hcb.total_matches > 0 THEN round((hcb.total_comebacks * 2 - (hcb.blown_lead_losses + hcb.blown_lead_draws))::numeric / hcb.total_matches, 3) ELSE 0 END
    )
  ),
  'away', json_build_object(
    'basic_stats', json_build_object(
      'total_matches', acb.total_matches,
      'form_index', CASE WHEN acb.total_matches > 0 THEN round((acb.comeback_wins * 3 + acb.comeback_draws)::numeric / (acb.total_matches * 3), 3) ELSE 0 END
    ),
    'comeback_breakdown', json_build_object(
      'comeback_wins', acb.comeback_wins,
      'comeback_draws', acb.comeback_draws,
      'total_comebacks', acb.total_comebacks,
      'comeback_frequency', CASE WHEN acb.total_matches > 0 THEN round(acb.total_comebacks::numeric / acb.total_matches, 3) ELSE 0 END,
      'comeback_success_rate', CASE WHEN acb.total_comebacks > 0 THEN round(acb.comeback_wins::numeric / acb.total_comebacks, 3) ELSE 0 END
    ),
    'comeback_by_deficit', json_build_object(
      'from_1goal', acb.comeback_1goal,
      'from_2goal', acb.comeback_2goal,
      'from_3plus_goal', acb.comeback_3plus_goal,
      'max_deficit_overcome', acb.max_comeback_deficit
    ),
    'blown_leads', json_build_object(
      'blown_lead_losses', acb.blown_lead_losses,
      'blown_lead_draws', acb.blown_lead_draws,
      'blown_lead_frequency', CASE WHEN acb.total_matches > 0 THEN round((acb.blown_lead_losses + acb.blown_lead_draws)::numeric / acb.total_matches, 3) ELSE 0 END
    ),
    'mental_strength', json_build_object(
      'avg_comeback_margin', round(COALESCE(acb.avg_comeback_margin, 0)::numeric, 2),
      'resilience_score', CASE WHEN acb.total_matches > 0 THEN round((acb.total_comebacks * 2 - (acb.blown_lead_losses + acb.blown_lead_draws))::numeric / acb.total_matches, 3) ELSE 0 END
    )
  ),
  'h2h_comeback_analysis', json_build_object(
    'total_matches', h2h.total_matches,
    'home_team_comebacks', h2h.home_team_comebacks,
    'away_team_comebacks', h2h.away_team_comebacks,
    'comeback_advantage', CASE WHEN h2h.total_matches > 0 THEN 
      round((h2h.home_team_comebacks - h2h.away_team_comebacks)::numeric / h2h.total_matches, 3) ELSE 0 END,
    'avg_intensity', round(COALESCE(h2h.avg_ft_goal_diff, 0)::numeric, 2)
  ),
  'legend_mode_insights', json_build_object(
    'comeback_kings', CASE 
      WHEN hcb.total_matches > 0 AND acb.total_matches > 0 THEN
        CASE WHEN (hcb.total_comebacks::numeric / hcb.total_matches) > (acb.total_comebacks::numeric / acb.total_matches) 
        THEN :home_team ELSE :away_team END
      ELSE 'insufficient_data' END,
    'mental_toughness_winner', CASE 
      WHEN hcb.total_matches > 0 AND acb.total_matches > 0 THEN
        CASE WHEN ((hcb.total_comebacks * 2 - (hcb.blown_lead_losses + hcb.blown_lead_draws))::numeric / hcb.total_matches) > 
                  ((acb.total_comebacks * 2 - (acb.blown_lead_losses + acb.blown_lead_draws))::numeric / acb.total_matches)
        THEN :home_team ELSE :away_team END
      ELSE 'insufficient_data' END,
    'prediction_weight', json_build_object(
      'comeback_factor_importance', 0.25,
      'mental_strength_bonus', 0.15,
      'h2h_comeback_history', 0.10
    )
  ),
  'meta', json_build_object(
    'generated_at', now(),
    'model_version', 'legend_mode_v1',
    'league', :league,
    'home_team', :home_team,
    'away_team', :away_team,
    'analysis_depth', 'legend_mode_comeback_breakdown'
  )
) AS legend_features_json
FROM home_comeback_breakdown hcb, away_comeback_breakdown acb, h2h_comeback_analysis h2h;
