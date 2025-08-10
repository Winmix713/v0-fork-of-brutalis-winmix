-- Enhanced Predictions Table with Form/H2H/Ensemble support
-- Migration 005: Production-ready predictions cache + audit

BEGIN;

-- 1) Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS public.enhanced_predictions CASCADE;
DROP TABLE IF EXISTS public.prediction_cleanup_log CASCADE;
DROP VIEW IF EXISTS enhanced_predictions_performance CASCADE;
DROP VIEW IF EXISTS prediction_data_quality CASCADE;
DROP VIEW IF EXISTS model_prediction_comparison CASCADE;
DROP VIEW IF EXISTS cache_statistics CASCADE;

-- 2) Enhanced predictions table
CREATE TABLE public.enhanced_predictions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Match identification
  league TEXT NOT NULL DEFAULT 'spain',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date DATE,
  
  -- Prediction data (JSON structure)
  prediction JSONB NOT NULL,
  features JSONB NOT NULL,
  
  -- Model metadata
  model_version TEXT NOT NULL DEFAULT 'enhanced_stat_v1.1',
  confidence NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Cache management
  cache_key TEXT UNIQUE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Audit fields
  created_by TEXT DEFAULT 'system',
  request_ip INET,
  user_agent TEXT,
  
  -- Performance tracking
  generation_time_ms INTEGER,
  data_sources JSONB, -- which tables/APIs were used
  
  -- Quality metrics
  data_quality_score NUMERIC(3,2),
  feature_completeness NUMERIC(3,2),
  
  CONSTRAINT valid_teams CHECK (home_team != away_team),
  CONSTRAINT valid_cache_key CHECK (LENGTH(cache_key) = 32),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- 3) Indexes for performance
CREATE INDEX idx_enhanced_predictions_teams 
ON enhanced_predictions (league, home_team, away_team);

CREATE INDEX idx_enhanced_predictions_match_date 
ON enhanced_predictions (match_date DESC);

CREATE INDEX idx_enhanced_predictions_cache_key 
ON enhanced_predictions (cache_key) WHERE expires_at > NOW();

CREATE INDEX idx_enhanced_predictions_expires 
ON enhanced_predictions (expires_at) WHERE expires_at <= NOW();

CREATE INDEX idx_enhanced_predictions_model_version 
ON enhanced_predictions (model_version, generated_at DESC);

-- 4) Partial indexes for active cache
CREATE INDEX idx_enhanced_predictions_active_cache 
ON enhanced_predictions (home_team, away_team, match_date) 
WHERE expires_at > NOW();

-- 5) GIN index for JSON queries
CREATE INDEX idx_enhanced_predictions_prediction_gin 
ON enhanced_predictions USING GIN (prediction);

CREATE INDEX idx_enhanced_predictions_features_gin 
ON enhanced_predictions USING GIN (features);

-- 6) Composite index for performance
CREATE INDEX idx_enhanced_predictions_lookup 
ON enhanced_predictions (league, home_team, away_team, match_date, expires_at DESC);

-- 7) Upsert function for cache management
CREATE OR REPLACE FUNCTION upsert_enhanced_prediction(
  p_league TEXT,
  p_home_team TEXT,
  p_away_team TEXT,
  p_match_date DATE,
  p_prediction JSONB,
  p_features JSONB,
  p_model_version TEXT,
  p_confidence NUMERIC,
  p_cache_key TEXT,
  p_generation_time_ms INTEGER DEFAULT NULL,
  p_data_quality_score NUMERIC DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  result_id BIGINT;
BEGIN
  INSERT INTO enhanced_predictions (
    league, home_team, away_team, match_date,
    prediction, features, model_version, confidence,
    cache_key, generation_time_ms, data_quality_score,
    expires_at
  ) VALUES (
    p_league, p_home_team, p_away_team, p_match_date,
    p_prediction, p_features, p_model_version, p_confidence,
    p_cache_key, p_generation_time_ms, p_data_quality_score,
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (cache_key) DO UPDATE SET
    prediction = EXCLUDED.prediction,
    features = EXCLUDED.features,
    model_version = EXCLUDED.model_version,
    confidence = EXCLUDED.confidence,
    generation_time_ms = EXCLUDED.generation_time_ms,
    data_quality_score = EXCLUDED.data_quality_score,
    generated_at = NOW(),
    expires_at = NOW() + INTERVAL '24 hours'
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- 8) Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_predictions() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete expired predictions older than 7 days
  DELETE FROM enhanced_predictions 
  WHERE expires_at <= NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO prediction_cleanup_log (
    cleanup_date,
    deleted_count,
    cleanup_type
  ) VALUES (
    NOW()::DATE,
    deleted_count,
    'expired_predictions'
  ) ON CONFLICT (cleanup_date, cleanup_type) DO UPDATE SET
    deleted_count = EXCLUDED.deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 9) Cleanup log table
CREATE TABLE public.prediction_cleanup_log (
  id BIGSERIAL PRIMARY KEY,
  cleanup_date DATE NOT NULL,
  deleted_count INTEGER NOT NULL DEFAULT 0,
  cleanup_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(cleanup_date, cleanup_type)
);

-- 10) Performance monitoring view
CREATE OR REPLACE VIEW enhanced_predictions_performance AS
SELECT 
  DATE(generated_at) as prediction_date,
  model_version,
  COUNT(*) as total_predictions,
  AVG(generation_time_ms) as avg_generation_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time_ms) as p95_generation_time_ms,
  AVG(confidence) as avg_confidence,
  AVG(data_quality_score) as avg_data_quality,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cache_count,
  COUNT(DISTINCT CONCAT(home_team, '|', away_team)) as unique_matchups
FROM enhanced_predictions
WHERE generated_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(generated_at), model_version
ORDER BY prediction_date DESC, model_version;

-- 11) Data quality monitoring view
CREATE OR REPLACE VIEW prediction_data_quality AS
SELECT 
  home_team,
  away_team,
  AVG(confidence) as avg_confidence,
  AVG(data_quality_score) as avg_data_quality,
  COUNT(*) as prediction_count,
  MAX(generated_at) as last_prediction,
  AVG(generation_time_ms) as avg_generation_time,
  -- Extract feature completeness
  AVG(CAST(features->>'home_total_matches' AS INTEGER)) as avg_home_matches,
  AVG(CAST(features->>'away_total_matches' AS INTEGER)) as avg_away_matches,
  AVG(CAST(features->'h2h_summary'->>'matches' AS INTEGER)) as avg_h2h_matches
FROM enhanced_predictions
WHERE generated_at >= NOW() - INTERVAL '7 days'
GROUP BY home_team, away_team
HAVING COUNT(*) >= 2
ORDER BY avg_confidence DESC, avg_data_quality DESC;

-- 12) Model comparison view
CREATE OR REPLACE VIEW model_prediction_comparison AS
SELECT 
  home_team,
  away_team,
  match_date,
  -- Extract form predictions
  CAST(prediction->'predictions'->'form'->>'home' AS NUMERIC) as form_home,
  CAST(prediction->'predictions'->'form'->>'draw' AS NUMERIC) as form_draw,
  CAST(prediction->'predictions'->'form'->>'away' AS NUMERIC) as form_away,
  -- Extract h2h predictions
  CAST(prediction->'predictions'->'h2h'->>'home' AS NUMERIC) as h2h_home,
  CAST(prediction->'predictions'->'h2h'->>'draw' AS NUMERIC) as h2h_draw,
  CAST(prediction->'predictions'->'h2h'->>'away' AS NUMERIC) as h2h_away,
  -- Extract ensemble predictions
  CAST(prediction->'predictions'->'ensemble'->>'home' AS NUMERIC) as ensemble_home,
  CAST(prediction->'predictions'->'ensemble'->>'draw' AS NUMERIC) as ensemble_draw,
  CAST(prediction->'predictions'->'ensemble'->>'away' AS NUMERIC) as ensemble_away,
  -- Model agreement metrics
  ABS(CAST(prediction->'predictions'->'form'->>'home' AS NUMERIC) - 
      CAST(prediction->'predictions'->'h2h'->>'home' AS NUMERIC)) as home_disagreement,
  confidence,
  generated_at
FROM enhanced_predictions
WHERE generated_at >= NOW() - INTERVAL '7 days'
ORDER BY generated_at DESC;

-- 13) Cache statistics view
CREATE OR REPLACE VIEW cache_statistics AS
SELECT 
  DATE(generated_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_cache,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_cache,
  ROUND(AVG(generation_time_ms), 2) as avg_generation_time_ms,
  ROUND(AVG(confidence), 3) as avg_confidence,
  COUNT(DISTINCT home_team) as unique_home_teams,
  COUNT(DISTINCT away_team) as unique_away_teams
FROM enhanced_predictions
WHERE generated_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(generated_at)
ORDER BY date DESC;

-- 14) Insert sample data for testing
INSERT INTO enhanced_predictions (
  league, home_team, away_team, match_date,
  prediction, features, model_version, confidence, cache_key,
  generation_time_ms, data_quality_score
) VALUES 
(
  'spain', 'Valencia', 'Villarreal', '2025-08-15',
  '{
    "predictions": {
      "form": {"home": 0.45, "draw": 0.30, "away": 0.25, "btts": 0.6, "over_25": 0.55},
      "h2h": {"home": 0.50, "draw": 0.25, "away": 0.25, "btts": 0.4, "over_25": 0.45},
      "ensemble": {"home": 0.47, "draw": 0.28, "away": 0.25, "btts": 0.5, "over_25": 0.50}
    }
  }'::jsonb,
  '{
    "home": {"form_index": {"value": 67.5, "window": 10}, "avg_goals": 1.2, "btts_rate": 0.6, "over_25_rate": 0.55},
    "away": {"form_index": {"value": 72.1, "window": 10}, "avg_goals": 1.4, "btts_rate": 0.4, "over_25_rate": 0.45},
    "h2h_summary": {"matches": 6, "home_wins": 3, "away_wins": 1, "draws": 2, "comeback_count": 1}
  }'::jsonb,
  'enhanced_stat_v1.1',
  0.78,
  MD5('Valencia_vs_Villarreal_2025-08-15'),
  145,
  0.85
),
(
  'spain', 'Real Madrid', 'Barcelona', '2025-08-16',
  '{
    "predictions": {
      "form": {"home": 0.55, "draw": 0.25, "away": 0.20, "btts": 0.7, "over_25": 0.75},
      "h2h": {"home": 0.45, "draw": 0.30, "away": 0.25, "btts": 0.8, "over_25": 0.65},
      "ensemble": {"home": 0.50, "draw": 0.27, "away": 0.23, "btts": 0.75, "over_25": 0.70}
    }
  }'::jsonb,
  '{
    "home": {"form_index": {"value": 85.2, "window": 10}, "avg_goals": 2.1, "btts_rate": 0.7, "over_25_rate": 0.75},
    "away": {"form_index": {"value": 82.8, "window": 10}, "avg_goals": 1.9, "btts_rate": 0.8, "over_25_rate": 0.65},
    "h2h_summary": {"matches": 15, "home_wins": 7, "away_wins": 6, "draws": 2, "comeback_count": 3}
  }'::jsonb,
  'enhanced_stat_v1.1',
  0.92,
  MD5('Real Madrid_vs_Barcelona_2025-08-16'),
  89,
  0.95
);

-- 15) Grant permissions (adjust as needed)
GRANT SELECT ON enhanced_predictions TO PUBLIC;
GRANT SELECT ON enhanced_predictions_performance TO PUBLIC;
GRANT SELECT ON prediction_data_quality TO PUBLIC;
GRANT SELECT ON model_prediction_comparison TO PUBLIC;
GRANT SELECT ON cache_statistics TO PUBLIC;
GRANT SELECT ON prediction_cleanup_log TO PUBLIC;

-- 16) Enable RLS (uncomment when ready for production security)
-- ALTER TABLE enhanced_predictions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read access" ON enhanced_predictions FOR SELECT USING (true);
-- CREATE POLICY "System insert only" ON enhanced_predictions FOR INSERT WITH CHECK (created_by IN ('system', 'frontend'));

COMMIT;

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as sample_records FROM enhanced_predictions;
SELECT * FROM enhanced_predictions_performance LIMIT 5;
