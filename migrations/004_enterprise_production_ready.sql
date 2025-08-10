-- LEGEND MODE Enterprise Production Ready Package
-- Data retention + Health monitoring + Drill-down analytics + ML-ready structure
BEGIN;

-- 1) Enhanced baseline logging with retention policy
CREATE TABLE IF NOT EXISTS public.legend_baseline_logs (
  id BIGSERIAL PRIMARY KEY,
  league VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  
  -- Core metrics for ML training
  comeback_frequency_home DECIMAL(5,3),
  comeback_frequency_away DECIMAL(5,3),
  resilience_score_home DECIMAL(5,3),
  resilience_score_away DECIMAL(5,3),
  legend_score_home DECIMAL(5,2),
  legend_score_away DECIMAL(5,2),
  
  -- Performance metrics
  execution_time_ms DECIMAL(8,2),
  cache_hit BOOLEAN DEFAULT FALSE,
  api_version VARCHAR(32),
  endpoint_path VARCHAR(255),
  
  -- A/B testing data
  ui_variant VARCHAR(32) DEFAULT 'legend_v1',
  user_session_id VARCHAR(64),
  user_engagement_score DECIMAL(3,2),
  tooltip_interactions INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- Request context
  request_id UUID DEFAULT gen_random_uuid(),
  user_agent TEXT,
  ip_address INET,
  device_type VARCHAR(32),
  
  -- Timestamps with retention
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
  archived BOOLEAN DEFAULT FALSE,
  
  -- Full data for ML
  full_features JSONB,
  prediction_result JSONB,
  match_context JSONB
);

-- 2) Daily digest aggregation table
CREATE TABLE IF NOT EXISTS public.legend_daily_digest (
  id BIGSERIAL PRIMARY KEY,
  digest_date DATE NOT NULL UNIQUE,
  
  -- Performance summary
  total_requests INTEGER DEFAULT 0,
  avg_execution_time_ms DECIMAL(8,2),
  p95_execution_time_ms DECIMAL(8,2),
  p99_execution_time_ms DECIMAL(8,2),
  error_count INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2),
  cache_hit_rate DECIMAL(5,2),
  
  -- Usage summary
  unique_team_pairs INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  
  -- Quality metrics
  avg_resilience_score DECIMAL(5,3),
  avg_comeback_frequency DECIMAL(5,3),
  data_consistency_score DECIMAL(5,2),
  
  -- A/B testing summary
  ab_test_participants INTEGER DEFAULT 0,
  variant_performance JSONB,
  
  -- Alerts summary
  alerts_triggered INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  alert_summary JSONB,
  
  -- SLA compliance
  sla_compliance_percentage DECIMAL(5,2),
  sla_breaches INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Drill-down analytics table for detailed investigation
CREATE TABLE IF NOT EXISTS public.legend_drill_down_analytics (
  id BIGSERIAL PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL, -- 'resilience_change', 'performance_spike', 'anomaly_detection'
  team_name VARCHAR(100),
  league VARCHAR(50),
  
  -- Time range for analysis
  analysis_start TIMESTAMPTZ NOT NULL,
  analysis_end TIMESTAMPTZ NOT NULL,
  
  -- Metrics comparison
  baseline_value DECIMAL(8,3),
  current_value DECIMAL(8,3),
  change_percentage DECIMAL(6,2),
  change_direction VARCHAR(10), -- 'increase', 'decrease', 'stable'
  
  -- Contributing factors
  contributing_matches JSONB, -- Array of match IDs and details
  external_factors JSONB, -- Weather, injuries, transfers, etc.
  statistical_significance DECIMAL(5,3),
  
  -- Root cause analysis
  primary_cause VARCHAR(255),
  secondary_causes TEXT[],
  confidence_score DECIMAL(3,2),
  
  -- Recommendations
  recommended_actions JSONB,
  business_impact VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by VARCHAR(100) DEFAULT 'system'
);

-- 4) API Health monitoring table
CREATE TABLE IF NOT EXISTS public.legend_api_health (
  id BIGSERIAL PRIMARY KEY,
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Health status
  overall_status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'critical', 'down'
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(8,2),
  p95_response_time_ms DECIMAL(8,2),
  error_rate DECIMAL(5,2),
  cache_hit_rate DECIMAL(5,2),
  
  -- System resources
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  database_connections INTEGER,
  
  -- Feature-specific health
  legend_mode_available BOOLEAN DEFAULT TRUE,
  beast_mode_available BOOLEAN DEFAULT TRUE,
  prediction_accuracy DECIMAL(5,2),
  
  -- SLA metrics
  uptime_percentage DECIMAL(5,2),
  sla_compliance BOOLEAN DEFAULT TRUE,
  
  -- Detailed status
  health_details JSONB,
  
  -- Retention (keep 30 days of health checks)
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- 5) Enhanced indexes for enterprise performance
CREATE INDEX IF NOT EXISTS idx_baseline_logs_retention 
ON legend_baseline_logs (expires_at, archived) WHERE NOT archived;

CREATE INDEX IF NOT EXISTS idx_baseline_logs_ml_training 
ON legend_baseline_logs (logged_at DESC, league, home_team, away_team) 
WHERE NOT archived AND full_features IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_baseline_logs_performance_analysis 
ON legend_baseline_logs (execution_time_ms, cache_hit, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_baseline_logs_ab_testing 
ON legend_baseline_logs (ui_variant, user_engagement_score, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_drill_down_team_analysis 
ON legend_drill_down_analytics (team_name, analysis_type, analysis_start DESC);

CREATE INDEX IF NOT EXISTS idx_api_health_timeline 
ON legend_api_health (check_timestamp DESC, overall_status);

-- 6) Automated data retention function
CREATE OR REPLACE FUNCTION cleanup_expired_legend_data() RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- Archive expired baseline logs (move to archive table or mark as archived)
  UPDATE legend_baseline_logs 
  SET archived = TRUE 
  WHERE expires_at <= now() AND NOT archived;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Delete very old archived data (older than 1 year)
  DELETE FROM legend_baseline_logs 
  WHERE archived = TRUE AND logged_at <= (now() - interval '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old health checks
  DELETE FROM legend_api_health 
  WHERE expires_at <= now();
  
  -- Log cleanup activity
  INSERT INTO legend_daily_digest (
    digest_date, 
    total_requests, 
    alert_summary
  ) VALUES (
    CURRENT_DATE,
    0,
    json_build_object(
      'cleanup_activity', json_build_object(
        'archived_logs', archived_count,
        'deleted_logs', deleted_count,
        'cleanup_timestamp', now()
      )
    )
  ) ON CONFLICT (digest_date) DO UPDATE SET
    alert_summary = COALESCE(legend_daily_digest.alert_summary, '{}'::jsonb) || 
                   json_build_object(
                     'cleanup_activity', json_build_object(
                       'archived_logs', archived_count,
                       'deleted_logs', deleted_count,
                       'cleanup_timestamp', now()
                     )
                   ),
    updated_at = now();
  
  RETURN archived_count + deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7) Daily digest generation function
CREATE OR REPLACE FUNCTION generate_legend_daily_digest(target_date DATE DEFAULT CURRENT_DATE - 1) RETURNS VOID AS $$
DECLARE
  digest_data RECORD;
BEGIN
  -- Calculate daily metrics
  SELECT 
    COUNT(*) as total_requests,
    AVG(execution_time_ms) as avg_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY execution_time_ms) as p99_execution_time,
    COUNT(*) FILTER (WHERE cache_hit = TRUE)::DECIMAL / COUNT(*) * 100 as cache_hit_rate,
    COUNT(DISTINCT CONCAT(home_team, '|', away_team)) as unique_team_pairs,
    COUNT(DISTINCT user_session_id) as unique_users,
    AVG(resilience_score_home + resilience_score_away) / 2 as avg_resilience_score,
    AVG(comeback_frequency_home + comeback_frequency_away) / 2 as avg_comeback_frequency,
    COUNT(DISTINCT ui_variant) as ab_variants_active,
    AVG(user_engagement_score) as avg_engagement
  INTO digest_data
  FROM legend_baseline_logs 
  WHERE DATE(logged_at) = target_date AND NOT archived;
  
  -- Insert or update daily digest
  INSERT INTO legend_daily_digest (
    digest_date,
    total_requests,
    avg_execution_time_ms,
    p95_execution_time_ms,
    p99_execution_time_ms,
    cache_hit_rate,
    unique_team_pairs,
    unique_users,
    avg_resilience_score,
    avg_comeback_frequency,
    ab_test_participants,
    sla_compliance_percentage
  ) VALUES (
    target_date,
    digest_data.total_requests,
    digest_data.avg_execution_time,
    digest_data.p95_execution_time,
    digest_data.p99_execution_time,
    digest_data.cache_hit_rate,
    digest_data.unique_team_pairs,
    digest_data.unique_users,
    digest_data.avg_resilience_score,
    digest_data.avg_comeback_frequency,
    digest_data.unique_users,
    CASE WHEN digest_data.avg_execution_time <= 70 THEN 100.0 ELSE 85.0 END
  ) ON CONFLICT (digest_date) DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
    p95_execution_time_ms = EXCLUDED.p95_execution_time_ms,
    p99_execution_time_ms = EXCLUDED.p99_execution_time_ms,
    cache_hit_rate = EXCLUDED.cache_hit_rate,
    unique_team_pairs = EXCLUDED.unique_team_pairs,
    unique_users = EXCLUDED.unique_users,
    avg_resilience_score = EXCLUDED.avg_resilience_score,
    avg_comeback_frequency = EXCLUDED.avg_comeback_frequency,
    ab_test_participants = EXCLUDED.ab_test_participants,
    sla_compliance_percentage = EXCLUDED.sla_compliance_percentage,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 8) API Health check function
CREATE OR REPLACE FUNCTION record_legend_api_health(
  p_response_time_ms DECIMAL(8,2),
  p_error_rate DECIMAL(5,2) DEFAULT 0,
  p_cache_hit_rate DECIMAL(5,2) DEFAULT 90,
  p_additional_metrics JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
  health_status VARCHAR(20);
  sla_compliant BOOLEAN;
BEGIN
  -- Determine health status
  IF p_response_time_ms <= 50 AND p_error_rate <= 1 THEN
    health_status := 'healthy';
  ELSIF p_response_time_ms <= 70 AND p_error_rate <= 2 THEN
    health_status := 'degraded';
  ELSIF p_response_time_ms <= 100 AND p_error_rate <= 5 THEN
    health_status := 'critical';
  ELSE
    health_status := 'down';
  END IF;
  
  -- Check SLA compliance (< 70ms, < 2% error rate)
  sla_compliant := (p_response_time_ms < 70 AND p_error_rate < 2);
  
  -- Record health check
  INSERT INTO legend_api_health (
    overall_status,
    avg_response_time_ms,
    error_rate,
    cache_hit_rate,
    sla_compliance,
    health_details
  ) VALUES (
    health_status,
    p_response_time_ms,
    p_error_rate,
    p_cache_hit_rate,
    sla_compliant,
    p_additional_metrics
  );
END;
$$ LANGUAGE plpgsql;

-- 9) Drill-down analysis trigger function
CREATE OR REPLACE FUNCTION trigger_drill_down_analysis() RETURNS TRIGGER AS $$
DECLARE
  analysis_needed BOOLEAN := FALSE;
  change_threshold DECIMAL(5,2) := 25.0;
BEGIN
  -- Check if significant change warrants drill-down analysis
  IF ABS(NEW.resilience_change_percent) >= change_threshold 
     OR ABS(NEW.comeback_change_percent) >= change_threshold 
     OR ABS(NEW.legend_change_percent) >= change_threshold THEN
    
    analysis_needed := TRUE;
  END IF;
  
  -- Create drill-down analysis record
  IF analysis_needed THEN
    INSERT INTO legend_drill_down_analytics (
      analysis_type,
      team_name,
      league,
      analysis_start,
      analysis_end,
      baseline_value,
      current_value,
      change_percentage,
      change_direction,
      primary_cause,
      confidence_score
    ) VALUES (
      CASE 
        WHEN ABS(NEW.resilience_change_percent) >= change_threshold THEN 'resilience_change'
        WHEN ABS(NEW.comeback_change_percent) >= change_threshold THEN 'comeback_anomaly'
        ELSE 'legend_score_shift'
      END,
      NEW.team_name,
      NEW.league,
      now() - interval '7 days',
      now(),
      CASE 
        WHEN ABS(NEW.resilience_change_percent) >= change_threshold THEN NEW.previous_resilience_score
        WHEN ABS(NEW.comeback_change_percent) >= change_threshold THEN NEW.previous_comeback_frequency
        ELSE NEW.previous_legend_score
      END,
      CASE 
        WHEN ABS(NEW.resilience_change_percent) >= change_threshold THEN NEW.current_resilience_score
        WHEN ABS(NEW.comeback_change_percent) >= change_threshold THEN NEW.current_comeback_frequency
        ELSE NEW.current_legend_score
      END,
      CASE 
        WHEN ABS(NEW.resilience_change_percent) >= change_threshold THEN NEW.resilience_change_percent
        WHEN ABS(NEW.comeback_change_percent) >= change_threshold THEN NEW.comeback_change_percent
        ELSE NEW.legend_change_percent
      END,
      CASE 
        WHEN NEW.resilience_change_percent > 0 OR NEW.comeback_change_percent > 0 OR NEW.legend_change_percent > 0 
        THEN 'increase' 
        ELSE 'decrease' 
      END,
      'Automated analysis triggered by significant metric change',
      0.75
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10) Create trigger for drill-down analysis
CREATE TRIGGER trg_trigger_drill_down_analysis
  AFTER UPDATE ON team_resilience_tracking
  FOR EACH ROW
  WHEN (NEW.significant_change = TRUE AND OLD.significant_change = FALSE)
  EXECUTE FUNCTION trigger_drill_down_analysis();

-- 11) Scheduled jobs setup (if pg_cron is available)
-- Daily digest generation at 6 AM
-- SELECT cron.schedule('legend_daily_digest', '0 6 * * *', 'SELECT generate_legend_daily_digest();');

-- Data cleanup at 2 AM daily
-- SELECT cron.schedule('legend_data_cleanup', '0 2 * * *', 'SELECT cleanup_expired_legend_data();');

-- Health check every 5 minutes
-- SELECT cron.schedule('legend_health_check', '*/5 * * * *', 'SELECT record_legend_api_health(50.0, 1.0, 92.0);');

-- 12) Views for easy enterprise reporting
CREATE OR REPLACE VIEW legend_enterprise_dashboard AS
SELECT 
  d.digest_date,
  d.total_requests,
  d.avg_execution_time_ms,
  d.error_rate,
  d.cache_hit_rate,
  d.sla_compliance_percentage,
  d.unique_team_pairs,
  d.unique_users,
  h.overall_status as current_health_status,
  h.avg_response_time_ms as current_response_time,
  COUNT(a.id) as active_alerts
FROM legend_daily_digest d
LEFT JOIN legend_api_health h ON h.check_timestamp >= (now() - interval '5 minutes')
LEFT JOIN legend_drill_down_analytics a ON a.created_at >= d.digest_date 
  AND a.created_at < (d.digest_date + interval '1 day')
WHERE d.digest_date >= (CURRENT_DATE - interval '30 days')
GROUP BY d.digest_date, d.total_requests, d.avg_execution_time_ms, d.error_rate, 
         d.cache_hit_rate, d.sla_compliance_percentage, d.unique_team_pairs, 
         d.unique_users, h.overall_status, h.avg_response_time_ms
ORDER BY d.digest_date DESC;

-- 13) ML-ready data export view
CREATE OR REPLACE VIEW legend_ml_training_data AS
SELECT 
  l.home_team,
  l.away_team,
  l.league,
  l.comeback_frequency_home,
  l.comeback_frequency_away,
  l.resilience_score_home,
  l.resilience_score_away,
  l.legend_score_home,
  l.legend_score_away,
  l.execution_time_ms,
  l.user_engagement_score,
  l.full_features,
  l.prediction_result,
  l.logged_at,
  -- Add derived features for ML
  ABS(l.resilience_score_home - l.resilience_score_away) as resilience_difference,
  (l.comeback_frequency_home + l.comeback_frequency_away) / 2 as avg_comeback_frequency,
  CASE WHEN l.legend_score_home > l.legend_score_away THEN 'home' 
       WHEN l.legend_score_away > l.legend_score_home THEN 'away' 
       ELSE 'draw' END as predicted_winner
FROM legend_baseline_logs l
WHERE NOT l.archived 
  AND l.full_features IS NOT NULL 
  AND l.prediction_result IS NOT NULL
  AND l.logged_at >= (now() - interval '90 days')
ORDER BY l.logged_at DESC;

COMMIT;
