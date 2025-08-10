-- calculate_all_features_batch.sql
-- Bind params: :league, :home_team, :away_team
WITH
-- team matches recent (home OR away) for home team
home_matches AS (
  SELECT
    m.*,
    (CASE WHEN lower(m.home_team) = lower(:home_team) THEN 'home' ELSE 'away' END) AS perspective
  FROM matches m
  WHERE m.league = :league AND (lower(m.home_team) = lower(:home_team) OR lower(m.away_team) = lower(:home_team))
  ORDER BY m.match_date DESC
  LIMIT 100
),
-- team matches recent for away team
away_matches AS (
  SELECT
    m.*,
    (CASE WHEN lower(m.home_team) = lower(:away_team) THEN 'home' ELSE 'away' END) AS perspective
  FROM matches m
  WHERE m.league = :league AND (lower(m.home_team) = lower(:away_team) OR lower(m.away_team) = lower(:away_team))
  ORDER BY m.match_date DESC
  LIMIT 100
),
-- head-to-head
h2h_matches AS (
  SELECT m.*
  FROM matches m
  WHERE m.league = :league
    AND (
      (lower(m.home_team) = lower(:home_team) AND lower(m.away_team) = lower(:away_team))
      OR (lower(m.home_team) = lower(:away_team) AND lower(m.away_team) = lower(:home_team))
    )
  ORDER BY m.match_date DESC
  LIMIT 50
),

-- Aggregates for home
home_agg AS (
  SELECT
    COUNT(*) AS total_matches,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home < halftime_away AND fulltime_home > fulltime_away)
                   OR (perspective='away' AND halftime_away < halftime_home AND fulltime_away > fulltime_home) ) THEN 1 ELSE 0 END) AS comeback_wins,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home > halftime_away AND fulltime_home < fulltime_away)
                   OR (perspective='away' AND halftime_away > halftime_home AND fulltime_away < fulltime_home) ) THEN 1 ELSE 0 END) AS blown_leads,
    SUM(CASE WHEN ( (perspective='home' AND fulltime_home > fulltime_away)
                   OR (perspective='away' AND fulltime_away > fulltime_home) ) THEN 3
             WHEN (fulltime_home = fulltime_away) THEN 1 ELSE 0 END) AS points,
    AVG( (CASE WHEN perspective='home' THEN fulltime_home ELSE fulltime_away END) ) AS avg_scored,
    AVG( (CASE WHEN perspective='home' THEN fulltime_away ELSE fulltime_home END) ) AS avg_conceded,
    SUM(CASE WHEN (fulltime_home > 0 AND fulltime_away > 0) THEN 1 ELSE 0 END) AS btts_count,
    SUM(CASE WHEN ( (fulltime_home + fulltime_away) > 2 ) THEN 1 ELSE 0 END) AS over25_count,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home > halftime_away) OR (perspective='away' AND halftime_away > halftime_home) ) THEN 1 ELSE 0 END) AS ht_lead_count
  FROM home_matches
),

-- Aggregates for away
away_agg AS (
  SELECT
    COUNT(*) AS total_matches,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home < halftime_away AND fulltime_home > fulltime_away)
                   OR (perspective='away' AND halftime_away < halftime_home AND fulltime_away > fulltime_home) ) THEN 1 ELSE 0 END) AS comeback_wins,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home > halftime_away AND fulltime_home < fulltime_away)
                   OR (perspective='away' AND halftime_away > halftime_home AND fulltime_away < fulltime_home) ) THEN 1 ELSE 0 END) AS blown_leads,
    SUM(CASE WHEN ( (perspective='home' AND fulltime_home > fulltime_away)
                   OR (perspective='away' AND fulltime_away > fulltime_home) ) THEN 3
             WHEN (fulltime_home = fulltime_away) THEN 1 ELSE 0 END) AS points,
    AVG( (CASE WHEN perspective='home' THEN fulltime_home ELSE fulltime_away END) ) AS avg_scored,
    AVG( (CASE WHEN perspective='home' THEN fulltime_away ELSE fulltime_home END) ) AS avg_conceded,
    SUM(CASE WHEN (fulltime_home > 0 AND fulltime_away > 0) THEN 1 ELSE 0 END) AS btts_count,
    SUM(CASE WHEN ( (fulltime_home + fulltime_away) > 2 ) THEN 1 ELSE 0 END) AS over25_count,
    SUM(CASE WHEN ( (perspective='home' AND halftime_home > halftime_away) OR (perspective='away' AND halftime_away > halftime_home) ) THEN 1 ELSE 0 END) AS ht_lead_count
  FROM away_matches
),

-- H2H aggregates
h2h_agg AS (
  SELECT
    COUNT(*) AS total_matches,
    SUM(CASE WHEN fulltime_home > fulltime_away THEN 1 ELSE 0 END) FILTER (WHERE lower(home_team)=lower(:home_team)) AS home_wins_when_home,
    SUM(CASE WHEN fulltime_away > fulltime_home THEN 1 ELSE 0 END) FILTER (WHERE lower(away_team)=lower(:away_team)) AS away_wins_when_away,
    SUM(fulltime_home + fulltime_away) AS total_goals
  FROM h2h_matches
)

-- Final JSON output
SELECT json_build_object(
  'home', json_build_object(
    'total_matches', home_agg.total_matches,
    'comeback_wins', home_agg.comeback_wins,
    'comeback_ratio', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.comeback_wins::numeric/home_agg.total_matches)::numeric,3) ELSE NULL END,
    'blown_leads', home_agg.blown_leads,
    'blown_leads_ratio', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.blown_leads::numeric/home_agg.total_matches)::numeric,3) ELSE NULL END,
    'points', home_agg.points,
    'form_index', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.points::numeric/(home_agg.total_matches*3))::numeric,3) ELSE NULL END,
    'avg_scored', round(home_agg.avg_scored::numeric, 2),
    'avg_conceded', round(home_agg.avg_conceded::numeric, 2),
    'btts_rate', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.btts_count::numeric/home_agg.total_matches)::numeric,3) ELSE NULL END,
    'over25_rate', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.over25_count::numeric/home_agg.total_matches)::numeric,3) ELSE NULL END,
    'ht_lead_ratio', CASE WHEN home_agg.total_matches>0 THEN round((home_agg.ht_lead_count::numeric/home_agg.total_matches)::numeric,3) ELSE NULL END
  ),
  'away', json_build_object(
    'total_matches', away_agg.total_matches,
    'comeback_wins', away_agg.comeback_wins,
    'comeback_ratio', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.comeback_wins::numeric/away_agg.total_matches)::numeric,3) ELSE NULL END,
    'blown_leads', away_agg.blown_leads,
    'blown_leads_ratio', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.blown_leads::numeric/away_agg.total_matches)::numeric,3) ELSE NULL END,
    'points', away_agg.points,
    'form_index', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.points::numeric/(away_agg.total_matches*3))::numeric,3) ELSE NULL END,
    'avg_scored', round(away_agg.avg_scored::numeric, 2),
    'avg_conceded', round(away_agg.avg_conceded::numeric, 2),
    'btts_rate', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.btts_count::numeric/away_agg.total_matches)::numeric,3) ELSE NULL END,
    'over25_rate', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.over25_count::numeric/away_agg.total_matches)::numeric,3) ELSE NULL END,
    'ht_lead_ratio', CASE WHEN away_agg.total_matches>0 THEN round((away_agg.ht_lead_count::numeric/away_agg.total_matches)::numeric,3) ELSE NULL END
  ),
  'h2h', json_build_object(
    'total_matches', h2h_agg.total_matches,
    'home_wins_when_home', h2h_agg.home_wins_when_home,
    'away_wins_when_away', h2h_agg.away_wins_when_away,
    'total_goals_avg', CASE WHEN h2h_agg.total_matches>0 THEN round((h2h_agg.total_goals::numeric/h2h_agg.total_matches)::numeric,2) ELSE NULL END
  ),
  'meta', json_build_object(
    'generated_at', now(),
    'model_version', 'batch_sql_v1',
    'league', :league,
    'home_team', :home_team,
    'away_team', :away_team
  )
) AS features_json
FROM home_agg, away_agg, h2h_agg;
