-- 001_create_predictions_and_indexes.sql
BEGIN;

-- 1) predictions tábla
CREATE TABLE IF NOT EXISTS public.predictions (
  id BIGSERIAL PRIMARY KEY,
  league VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  features JSONB,
  prediction JSONB,
  model_version VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) unique constraint for upsert (league + pairing)
CREATE UNIQUE INDEX IF NOT EXISTS predictions_unique_idx
  ON public.predictions (league, lower(home_team), lower(away_team));

-- 3) Indexek for fast lookups
CREATE INDEX IF NOT EXISTS idx_predictions_generated_at ON public.predictions (generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_expires_at ON public.predictions (expires_at);
CREATE INDEX IF NOT EXISTS idx_predictions_league ON public.predictions (league);

-- 4) Partial index for "currently valid" cache rows (optional, speeds reads of non-expired)
CREATE INDEX IF NOT EXISTS idx_predictions_valid ON public.predictions (league, lower(home_team), lower(away_team))
  WHERE expires_at IS NULL OR expires_at > now();

-- 5) Trigger function to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at BEFORE UPDATE OR INSERT ON public.predictions
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6) Cleanup function (delete expired rows) - can be called via scheduled job (pg_cron) or manually
CREATE OR REPLACE FUNCTION public.clean_expired_predictions() RETURNS VOID AS $$
BEGIN
  DELETE FROM public.predictions
  WHERE expires_at IS NOT NULL AND expires_at <= now();
END;
$$ LANGUAGE plpgsql;

-- 7) CRITICAL: Matches table indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_league_date ON matches (league, match_date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_lower ON matches (lower(home_team));
CREATE INDEX IF NOT EXISTS idx_matches_away_team_lower ON matches (lower(away_team));
CREATE INDEX IF NOT EXISTS idx_matches_teams_league ON matches (league, lower(home_team), lower(away_team));

-- If pg_cron is available you can schedule:
-- SELECT cron.schedule('clean_predictions_daily', '0 3 * * *', 'SELECT public.clean_expired_predictions();');

COMMIT;
