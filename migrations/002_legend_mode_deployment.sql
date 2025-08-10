-- LEGEND MODE Production Deployment
-- Enhanced comeback breakdown with production optimizations
BEGIN;

-- 1) Add legend_mode columns to predictions table
ALTER TABLE public.predictions 
ADD COLUMN IF NOT EXISTS legend_features JSONB,
ADD COLUMN IF NOT EXISTS legend_insights JSONB;

-- 2) Create legend_mode specific indexes
CREATE INDEX IF NOT EXISTS idx_predictions_legend_features 
ON public.predictions USING GIN (legend_features);

CREATE INDEX IF NOT EXISTS idx_predictions_legend_insights 
ON public.predictions USING GIN (legend_insights);

-- 3) Enhanced matches table indexes for comeback analysis
CREATE INDEX IF NOT EXISTS idx_matches_comeback_analysis 
ON matches (league, match_date DESC, halftime_home, halftime_away, fulltime_home, fulltime_away);

-- 4) Materialized view for frequent comeback queries (optional performance boost)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_team_comeback_stats AS
SELECT 
  league,
  team_name,
  COUNT(*) as total_matches,
  COUNT(*) FILTER (WHERE comeback_type = 'comeback_win') as comeback_wins,
  COUNT(*) FILTER (WHERE comeback_type = 'comeback_draw') as comeback_draws,
  COUNT(*) FILTER (WHERE comeback_type = 'blown_lead_loss') as blown_leads,
  AVG(deficit_overcome) as avg_deficit_overcome,
  MAX(deficit_overcome) as max_deficit_overcome,
  last_updated
FROM (
  SELECT 
    m.league,
    CASE WHEN m.home_team = team_name THEN 'home' ELSE 'away' END as venue,
    team_name,
    CASE 
      WHEN (venue = 'home' AND halftime_home < halftime_away AND fulltime_home > fulltime_away)
        OR (venue = 'away' AND halftime_away < halftime_home AND fulltime_away > fulltime_home)
      THEN 'comeback_win'
      WHEN (venue = 'home' AND halftime_home < halftime_away AND fulltime_home = fulltime_away)
        OR (venue = 'away' AND halftime_away < halftime_home AND fulltime_away = fulltime_home)
      THEN 'comeback_draw'
      WHEN (venue = 'home' AND halftime_home > halftime_away AND fulltime_home < fulltime_away)
        OR (venue = 'away' AND halftime_away > halftime_home AND fulltime_away < fulltime_home)
      THEN 'blown_lead_loss'
      ELSE 'normal'
    END as comeback_type,
    ABS(CASE WHEN venue = 'home' THEN halftime_home - halftime_away ELSE halftime_away - halftime_home END) as deficit_overcome,
    now() as last_updated
  FROM matches m
  CROSS JOIN (
    SELECT DISTINCT home_team as team_name FROM matches 
    UNION 
    SELECT DISTINCT away_team as team_name FROM matches
  ) teams
  WHERE (m.home_team = teams.team_name OR m.away_team = teams.team_name)
    AND m.league = 'spain'
) comeback_analysis
GROUP BY league, team_name, last_updated;

-- 5) Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_comeback_stats() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_team_comeback_stats;
END;
$$ LANGUAGE plpgsql;

-- 6) Legend mode cache cleanup function
CREATE OR REPLACE FUNCTION clean_legend_cache() RETURNS VOID AS $$
BEGIN
  DELETE FROM public.predictions
  WHERE expires_at IS NOT NULL 
    AND expires_at <= now()
    AND (legend_features IS NOT NULL OR legend_insights IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

COMMIT;
