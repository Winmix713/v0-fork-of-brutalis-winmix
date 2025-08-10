-- Create matches table for football match data
-- This table will store all match information including scores and timestamps

-- Drop table if exists (for clean recreation)
DROP TABLE IF EXISTS matches CASCADE;

-- Create matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    half_time_home_goals INTEGER NOT NULL DEFAULT 0,
    half_time_away_goals INTEGER NOT NULL DEFAULT 0,
    full_time_home_goals INTEGER NOT NULL DEFAULT 0,
    full_time_away_goals INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE matches 
ADD CONSTRAINT chk_goals_non_negative 
CHECK (
    half_time_home_goals >= 0 AND 
    half_time_away_goals >= 0 AND 
    full_time_home_goals >= 0 AND 
    full_time_away_goals >= 0
);

ALTER TABLE matches 
ADD CONSTRAINT chk_fulltime_gte_halftime 
CHECK (
    full_time_home_goals >= half_time_home_goals AND 
    full_time_away_goals >= half_time_away_goals
);

ALTER TABLE matches 
ADD CONSTRAINT chk_different_teams 
CHECK (home_team != away_team);

-- Create indexes for better performance
CREATE INDEX idx_matches_teams ON matches(home_team, away_team);
CREATE INDEX idx_matches_time ON matches(match_time);
CREATE INDEX idx_matches_home_team ON matches(home_team);
CREATE INDEX idx_matches_away_team ON matches(away_team);
CREATE INDEX idx_matches_created_at ON matches(created_at);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to matches" ON matches
    FOR SELECT USING (true);

-- Allow insert for authenticated users (you can modify this as needed)
CREATE POLICY "Allow insert for authenticated users" ON matches
    FOR INSERT WITH CHECK (true);

-- Create a view for formatted match results
CREATE OR REPLACE VIEW matches_with_formatted_result AS
SELECT 
    *,
    CONCAT(full_time_home_goals, '-', full_time_away_goals) as formatted_result,
    CASE 
        WHEN full_time_home_goals > full_time_away_goals THEN 'home_win'
        WHEN full_time_home_goals < full_time_away_goals THEN 'away_win'
        ELSE 'draw'
    END as result_type,
    CASE 
        WHEN (half_time_home_goals < half_time_away_goals AND full_time_home_goals > full_time_away_goals) OR
             (half_time_away_goals < half_time_home_goals AND full_time_away_goals > full_time_home_goals)
        THEN true
        ELSE false
    END as is_comeback
FROM matches;

-- Insert some sample data for testing
INSERT INTO matches (match_time, home_team, away_team, half_time_home_goals, half_time_away_goals, full_time_home_goals, full_time_away_goals) VALUES
('2024-01-15 15:00:00+00', 'Barcelona', 'Real Madrid', 1, 0, 2, 1),
('2024-01-14 18:30:00+00', 'Valencia', 'Sevilla', 0, 1, 1, 1),
('2024-01-13 20:00:00+00', 'Bilbao', 'Villarreal', 2, 0, 3, 1),
('2024-01-12 16:15:00+00', 'Las Palmas', 'Getafe', 0, 0, 0, 2),
('2024-01-11 19:45:00+00', 'Girona', 'Alaves', 1, 1, 2, 2);

-- Show table info
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as sample_records
FROM matches;

-- Show sample data
SELECT * FROM matches_with_formatted_result LIMIT 5;
