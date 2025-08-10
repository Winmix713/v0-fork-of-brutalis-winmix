-- LEGEND MODE Enterprise Monitoring & Alerting System
-- Baseline data logging + Alert triggers + A/B testing infrastructure
BEGIN;

-- 1) Baseline logging table for GODMODE comparison
CREATE TABLE IF NOT EXISTS public.legend_baseline_logs (
  id BIGSERIAL PRIMARY KEY,
  league VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  
  -- Feature snapshots for comparison
  comeback_frequency_home DECIMAL(5,3),
  comeback_frequency_away DECIMAL(5,3),
  resilience_score_home DECIMAL(5,3),
  resilience_score_away DECIMAL(5,3),
  legend_score_home DECIMAL(5,2),
  legend_score_away DECIMAL(5,2),
  
  -- Performance metrics
  execution_time_ms DECIMAL(8,2),
  api_version VARCHAR(32),
  
  -- A/B testing variant
  ui_variant VARCHAR(32) DEFAULT 'legend_v1',
  user_session_id VARCHAR(64),
  
  -- Metadata
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  match_context JSONB,
  full_features JSONB
);

-- 2) Team resilience tracking for alerts
CREATE TABLE IF NOT EXISTS public.team_resilience_tracking (
  id BIGSERIAL PRIMARY KEY,
  league VARCHAR(50) NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  
  -- Current metrics
  current_resilience_score DECIMAL(5,3),
  current_comeback_frequency DECIMAL(5,3),
  current_legend_score DECIMAL(5,2),
  
  -- Historical comparison
  previous_resilience_score DECIMAL(5,3),
  previous_comeback_frequency DECIMAL(5,3),
  previous_legend_score DECIMAL(5,2),
  
  -- Change detection
  resilience_change_percent DECIMAL(6,2),
  comeback_change_percent DECIMAL(6,2),
  legend_change_percent DECIMAL(6,2),
  
  -- Alert flags
  significant_change BOOLEAN DEFAULT FALSE,
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_type VARCHAR(32),
  
  -- Timestamps
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_calculated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(league, team_name)
);

-- 3) A/B testing variants table
CREATE TABLE IF NOT EXISTS public.legend_ab_variants (
  id BIGSERIAL PRIMARY KEY,
  variant_name VARCHAR(32) NOT NULL UNIQUE,
  variant_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  traffic_percentage DECIMAL(5,2) DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) User interaction tracking for A/B testing
CREATE TABLE IF NOT EXISTS public.legend_user_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_session_id VARCHAR(64) NOT NULL,
  variant_name VARCHAR(32) NOT NULL,
  
  -- Interaction metrics
  time_spent_seconds INTEGER,
  tooltip_clicks INTEGER DEFAULT 0,
  card_expansions INTEGER DEFAULT 0,
  prediction_views INTEGER DEFAULT 0,
  
  -- UX feedback
  bounce_rate BOOLEAN DEFAULT FALSE,
  engagement_score DECIMAL(3,2),
  
  -- Context
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  device_type VARCHAR(32),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Alert configuration table
CREATE TABLE IF NOT EXISTS public.legend_alert_config (
  id BIGSERIAL PRIMARY KEY,
  alert_type VARCHAR(32) NOT NULL UNIQUE,
  threshold_percentage DECIMAL(5,2) NOT NULL,
  cooldown_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notification settings
  slack_webhook_url TEXT,
  email_recipients TEXT[],
  alert_message_template TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_baseline_logs_teams_date 
ON legend_baseline_logs (home_team, away_team, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_performance 
ON legend_baseline_logs (execution_time_ms, api_version, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_resilience_tracking_changes 
ON team_resilience_tracking (significant_change, alert_sent, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_ab_interactions_variant 
ON legend_user_interactions (variant_name, created_at DESC);

-- 7) Trigger function for resilience change detection
CREATE OR REPLACE FUNCTION detect_resilience_changes() RETURNS TRIGGER AS $$
DECLARE
  change_threshold DECIMAL(5,2);
  alert_config RECORD;
BEGIN
  -- Get alert threshold
  SELECT threshold_percentage INTO change_threshold 
  FROM legend_alert_config 
  WHERE alert_type = 'resilience_change' AND is_active = TRUE;
  
  IF change_threshold IS NULL THEN
    change_threshold := 25.00; -- Default 25% change threshold
  END IF;
  
  -- Calculate percentage changes
  IF OLD.current_resilience_score IS NOT NULL AND OLD.current_resilience_score != 0 THEN
    NEW.resilience_change_percent := 
      ((NEW.current_resilience_score - OLD.current_resilience_score) / OLD.current_resilience_score) * 100;
  END IF;
  
  IF OLD.current_comeback_frequency IS NOT NULL AND OLD.current_comeback_frequency != 0 THEN
    NEW.comeback_change_percent := 
      ((NEW.current_comeback_frequency - OLD.current_comeback_frequency) / OLD.current_comeback_frequency) * 100;
  END IF;
  
  IF OLD.current_legend_score IS NOT NULL AND OLD.current_legend_score != 0 THEN
    NEW.legend_change_percent := 
      ((NEW.current_legend_score - OLD.current_legend_score) / OLD.current_legend_score) * 100;
  END IF;
  
  -- Check for significant changes
  IF ABS(NEW.resilience_change_percent) >= change_threshold 
     OR ABS(NEW.comeback_change_percent) >= change_threshold 
     OR ABS(NEW.legend_change_percent) >= change_threshold THEN
    
    NEW.significant_change := TRUE;
    NEW.alert_type := CASE 
      WHEN ABS(NEW.resilience_change_percent) >= change_threshold THEN 'resilience_spike'
      WHEN ABS(NEW.comeback_change_percent) >= change_threshold THEN 'comeback_anomaly'
      WHEN ABS(NEW.legend_change_percent) >= change_threshold THEN 'legend_score_shift'
      ELSE 'general_change'
    END;
    
    -- Reset alert_sent flag for new significant changes
    NEW.alert_sent := FALSE;
  END IF;
  
  NEW.last_updated := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8) Create trigger
CREATE TRIGGER trg_detect_resilience_changes
  BEFORE UPDATE ON team_resilience_tracking
  FOR EACH ROW
  EXECUTE FUNCTION detect_resilience_changes();

-- 9) Function to log baseline data
CREATE OR REPLACE FUNCTION log_legend_baseline(
  p_league VARCHAR(50),
  p_home_team VARCHAR(100),
  p_away_team VARCHAR(100),
  p_features JSONB,
  p_execution_time DECIMAL(8,2),
  p_api_version VARCHAR(32),
  p_ui_variant VARCHAR(32) DEFAULT 'legend_v1',
  p_user_session VARCHAR(64) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO legend_baseline_logs (
    league, home_team, away_team,
    comeback_frequency_home, comeback_frequency_away,
    resilience_score_home, resilience_score_away,
    legend_score_home, legend_score_away,
    execution_time_ms, api_version, ui_variant, user_session_id,
    full_features
  ) VALUES (
    p_league, p_home_team, p_away_team,
    (p_features->'home'->'comeback_breakdown'->>'comeback_frequency')::DECIMAL(5,3),
    (p_features->'away'->'comeback_breakdown'->>'comeback_frequency')::DECIMAL(5,3),
    (p_features->'home'->'mental_strength'->>'resilience_score')::DECIMAL(5,3),
    (p_features->'away'->'mental_strength'->>'resilience_score')::DECIMAL(5,3),
    (p_features->'legend_mode_insights'->'legend_score'->>'home')::DECIMAL(5,2),
    (p_features->'legend_mode_insights'->'legend_score'->>'away')::DECIMAL(5,2),
    p_execution_time, p_api_version, p_ui_variant, p_user_session,
    p_features
  );
END;
$$ LANGUAGE plpgsql;

-- 10) Function to update team resilience tracking
CREATE OR REPLACE FUNCTION update_team_resilience(
  p_league VARCHAR(50),
  p_team_name VARCHAR(100),
  p_resilience_score DECIMAL(5,3),
  p_comeback_frequency DECIMAL(5,3),
  p_legend_score DECIMAL(5,2)
) RETURNS VOID AS $$
BEGIN
  INSERT INTO team_resilience_tracking (
    league, team_name, 
    current_resilience_score, current_comeback_frequency, current_legend_score,
    last_calculated
  ) VALUES (
    p_league, p_team_name,
    p_resilience_score, p_comeback_frequency, p_legend_score,
    now()
  )
  ON CONFLICT (league, team_name) DO UPDATE SET
    previous_resilience_score = team_resilience_tracking.current_resilience_score,
    previous_comeback_frequency = team_resilience_tracking.current_comeback_frequency,
    previous_legend_score = team_resilience_tracking.current_legend_score,
    current_resilience_score = p_resilience_score,
    current_comeback_frequency = p_comeback_frequency,
    current_legend_score = p_legend_score,
    last_calculated = now();
END;
$$ LANGUAGE plpgsql;

-- 11) Insert default alert configurations
INSERT INTO legend_alert_config (alert_type, threshold_percentage, cooldown_hours, alert_message_template) VALUES
('resilience_change', 25.00, 24, 'LEGEND ALERT: {team_name} resilience score changed by {change_percent}% - New score: {new_score}'),
('comeback_anomaly', 30.00, 12, 'COMEBACK ALERT: {team_name} comeback frequency shifted by {change_percent}% - Investigation recommended'),
('legend_score_shift', 20.00, 48, 'LEGEND SCORE ALERT: {team_name} overall legend score changed by {change_percent}% - Market impact possible')
ON CONFLICT (alert_type) DO NOTHING;

-- 12) Insert A/B testing variants
INSERT INTO legend_ab_variants (variant_name, variant_config, traffic_percentage) VALUES
('legend_v1_purple_orange', '{"theme": "purple_orange", "scale": "0_100", "tooltips": true}', 50.00),
('legend_v1_blue_green', '{"theme": "blue_green", "scale": "0_100", "tooltips": true}', 25.00),
('legend_v1_minimal', '{"theme": "minimal", "scale": "raw", "tooltips": false}', 25.00)
ON CONFLICT (variant_name) DO NOTHING;

COMMIT;
