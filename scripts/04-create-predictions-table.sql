-- Create predictions table for storing match predictions and analysis
-- This table will store AI-generated predictions and their accuracy tracking

BEGIN;

-- First, create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop table if exists (for clean recreation)
DROP TABLE IF EXISTS predictions CASCADE;

-- Create predictions table
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL DEFAULT 'basic', -- 'basic', 'legend_mode', 'ai_enhanced'
    
    -- Prediction probabilities
    home_win_probability DECIMAL(5,4) NOT NULL CHECK (home_win_probability >= 0 AND home_win_probability <= 1),
    draw_probability DECIMAL(5,4) NOT NULL CHECK (draw_probability >= 0 AND draw_probability <= 1),
    away_win_probability DECIMAL(5,4) NOT NULL CHECK (away_win_probability >= 0 AND away_win_probability <= 1),
    
    -- Score predictions
    predicted_home_goals DECIMAL(3,2),
    predicted_away_goals DECIMAL(3,2),
    predicted_total_goals DECIMAL(3,2),
    
    -- Confidence and metadata
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_version VARCHAR(50),
    features_used JSONB,
    
    -- Legend Mode specific fields
    comeback_probability_home DECIMAL(5,4),
    comeback_probability_away DECIMAL(5,4),
    resilience_factor_home DECIMAL(5,4),
    resilience_factor_away DECIMAL(5,4),
    mental_strength_home DECIMAL(5,4),
    mental_strength_away DECIMAL(5,4),
    
    -- Prediction accuracy (filled after match completion)
    actual_result VARCHAR(20), -- 'home_win', 'draw', 'away_win'
    prediction_correct BOOLEAN,
    probability_accuracy DECIMAL(5,4),
    
    -- Timestamps
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    match_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint to ensure probabilities sum to 1 (with tolerance for floating point precision)
ALTER TABLE predictions 
ADD CONSTRAINT chk_probabilities_sum_to_one 
CHECK (ABS((home_win_probability + draw_probability + away_win_probability) - 1.0) < 0.01);

-- Create indexes for better performance
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_predictions_teams ON predictions(home_team, away_team);
CREATE INDEX idx_predictions_type ON predictions(prediction_type);
CREATE INDEX idx_predictions_date ON predictions(match_date);
CREATE INDEX idx_predictions_accuracy ON predictions(prediction_correct) WHERE prediction_correct IS NOT NULL;
CREATE INDEX idx_predictions_confidence ON predictions(confidence_score) WHERE confidence_score IS NOT NULL;

-- Create partial index for pending predictions
CREATE INDEX idx_predictions_pending ON predictions(match_date) 
WHERE actual_result IS NULL;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_predictions_updated_at 
    BEFORE UPDATE ON predictions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (only if using Supabase auth)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to predictions" ON predictions
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for service role" ON predictions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for service role" ON predictions
    FOR UPDATE USING (true);

-- Create view for prediction analysis
CREATE OR REPLACE VIEW prediction_analysis AS
SELECT 
    p.*,
    CASE 
        WHEN p.home_win_probability >= p.draw_probability AND p.home_win_probability >= p.away_win_probability THEN 'home_win'
        WHEN p.away_win_probability >= p.draw_probability AND p.away_win_probability >= p.home_win_probability THEN 'away_win'
        ELSE 'draw'
    END as predicted_result
FROM predictions p;

-- Create function to get prediction accuracy statistics
CREATE OR REPLACE FUNCTION get_prediction_accuracy_stats(
    model_type VARCHAR(50) DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE(
    prediction_type VARCHAR(50),
    total_predictions BIGINT,
    correct_predictions BIGINT,
    accuracy_percentage DECIMAL(5,2),
    avg_confidence DECIMAL(5,4),
    avg_probability_accuracy DECIMAL(5,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.prediction_type,
        COUNT(*) as total_predictions,
        SUM(CASE WHEN p.prediction_correct THEN 1 ELSE 0 END) as correct_predictions,
        ROUND((SUM(CASE WHEN p.prediction_correct THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2) as accuracy_percentage,
        ROUND(AVG(p.confidence_score), 4) as avg_confidence,
        ROUND(AVG(p.probability_accuracy), 4) as avg_probability_accuracy
    FROM predictions p
    WHERE 
        p.actual_result IS NOT NULL
        AND (model_type IS NULL OR p.prediction_type = model_type)
        AND (date_from IS NULL OR p.match_date >= date_from)
        AND (date_to IS NULL OR p.match_date <= date_to)
    GROUP BY p.prediction_type
    ORDER BY accuracy_percentage DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample predictions for testing
INSERT INTO predictions (
    home_team, away_team, prediction_type, 
    home_win_probability, draw_probability, away_win_probability,
    predicted_home_goals, predicted_away_goals, predicted_total_goals,
    confidence_score, model_version,
    comeback_probability_home, comeback_probability_away,
    resilience_factor_home, resilience_factor_away,
    mental_strength_home, mental_strength_away,
    match_date
) VALUES
('Barcelona', 'Real Madrid', 'legend_mode', 0.45, 0.25, 0.30, 2.1, 1.8, 3.9, 0.78, 'legend_v1.0', 0.15, 0.12, 0.82, 0.85, 0.88, 0.91, '2024-02-15 20:00:00+00'),
('Valencia', 'Sevilla', 'legend_mode', 0.38, 0.32, 0.30, 1.6, 1.4, 3.0, 0.65, 'legend_v1.0', 0.22, 0.18, 0.71, 0.74, 0.69, 0.73, '2024-02-16 18:30:00+00'),
('Athletic Bilbao', 'Villarreal', 'basic', 0.42, 0.28, 0.30, 1.8, 1.5, 3.3, 0.72, 'basic_v1.0', NULL, NULL, NULL, NULL, NULL, NULL, '2024-02-17 16:00:00+00'),
('Atletico Madrid', 'Real Sociedad', 'legend_mode', 0.52, 0.23, 0.25, 2.3, 1.2, 3.5, 0.81, 'legend_v1.0', 0.18, 0.14, 0.89, 0.76, 0.92, 0.78, '2024-02-18 21:00:00+00'),
('Getafe', 'Osasuna', 'basic', 0.35, 0.40, 0.25, 1.2, 1.1, 2.3, 0.58, 'basic_v1.0', NULL, NULL, NULL, NULL, NULL, NULL, '2024-02-19 19:00:00+00');

COMMIT;

-- Show table info
SELECT 
    'Predictions table created successfully!' as status,
    COUNT(*) as sample_predictions
FROM predictions;

-- Show sample data
SELECT 
    id,
    home_team,
    away_team,
    prediction_type,
    home_win_probability,
    draw_probability,
    away_win_probability,
    confidence_score,
    model_version
FROM predictions 
ORDER BY id 
LIMIT 5;

-- Show prediction accuracy stats (will be empty until we have actual results)
SELECT * FROM get_prediction_accuracy_stats();
