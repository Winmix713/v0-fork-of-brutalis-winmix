<?php

class FeatureExtractor {
    private $supabase;
    
    public function __construct($supabaseClient) {
        $this->supabase = $supabaseClient;
    }
    
    /**
     * Kiszámítja az összes feature-t egy csapatpárosításhoz
     */
    public function extractAllFeatures($homeTeam, $awayTeam) {
        $features = [];
        
        // 1. Comeback statisztikák (KIEMELT)
        $features['home_comeback_win_ratio'] = $this->calculateComebackStats($homeTeam, 'win');
        $features['home_comeback_draw_ratio'] = $this->calculateComebackStats($homeTeam, 'draw');
        $features['home_blown_lead_ratio'] = $this->calculateBlownLeadStats($homeTeam, 'loss');
        $features['home_blown_lead_draw_ratio'] = $this->calculateBlownLeadStats($homeTeam, 'draw');
        
        $features['away_comeback_win_ratio'] = $this->calculateComebackStats($awayTeam, 'win');
        $features['away_comeback_draw_ratio'] = $this->calculateComebackStats($awayTeam, 'draw');
        $features['away_blown_lead_ratio'] = $this->calculateBlownLeadStats($awayTeam, 'loss');
        $features['away_blown_lead_draw_ratio'] = $this->calculateBlownLeadStats($awayTeam, 'draw');
        
        // 2. Forma index
        $features['home_form_index'] = $this->calculateFormIndex($homeTeam, 'home');
        $features['away_form_index'] = $this->calculateFormIndex($awayTeam, 'away');
        $features['home_overall_form'] = $this->calculateFormIndex($homeTeam, 'overall');
        $features['away_overall_form'] = $this->calculateFormIndex($awayTeam, 'overall');
        
        // 3. Gólátlagok
        $features['home_avg_goals_scored'] = $this->calculateGoalAverage($homeTeam, 'home', 'scored');
        $features['home_avg_goals_conceded'] = $this->calculateGoalAverage($homeTeam, 'home', 'conceded');
        $features['away_avg_goals_scored'] = $this->calculateGoalAverage($awayTeam, 'away', 'scored');
        $features['away_avg_goals_conceded'] = $this->calculateGoalAverage($awayTeam, 'away', 'conceded');
        
        // 4. BTTS és Over/Under
        $features['home_btts_ratio'] = $this->calculateBTTSRatio($homeTeam);
        $features['away_btts_ratio'] = $this->calculateBTTSRatio($awayTeam);
        $features['home_over_2_5_ratio'] = $this->calculateOverUnderRatio($homeTeam, 2.5, 'over');
        $features['away_over_2_5_ratio'] = $this->calculateOverUnderRatio($awayTeam, 2.5, 'over');
        
        // 5. Félidő statisztikák
        $features['home_ht_lead_ratio'] = $this->calculateHalftimeStats($homeTeam, 'lead');
        $features['away_ht_lead_ratio'] = $this->calculateHalftimeStats($awayTeam, 'lead');
        $features['home_ht_draw_ratio'] = $this->calculateHalftimeStats($homeTeam, 'draw');
        $features['away_ht_draw_ratio'] = $this->calculateHalftimeStats($awayTeam, 'draw');
        
        // 6. Head-to-head
        $features['h2h_stats'] = $this->calculateHeadToHeadStats($homeTeam, $awayTeam);
        
        // 7. Hazai pálya előny
        $features['home_advantage'] = $this->calculateHomeAdvantage($homeTeam);
        
        return $features;
    }
    
    /**
     * Comeback statisztikák számítása
     */
    private function calculateComebackStats($team, $resultType) {
        $sql = "
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE 
                    WHEN (home_team = ? AND half_time_home_goals < half_time_away_goals AND 
                          (? = 'win' AND full_time_home_goals > full_time_away_goals OR
                           ? = 'draw' AND full_time_home_goals = full_time_away_goals))
                    OR (away_team = ? AND half_time_away_goals < half_time_home_goals AND 
                        (? = 'win' AND full_time_away_goals > full_time_home_goals OR
                         ? = 'draw' AND full_time_away_goals = full_time_home_goals))
                    THEN 1 END) as comeback_count
            FROM matches 
            WHERE (home_team = ? OR away_team = ?) 
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 20
        ";
        
        $result = $this->supabase->query($sql, [
            $team, $resultType, $resultType, $team, $resultType, $resultType, $team, $team
        ]);
        
        $total = $result[0]['total_matches'] ?? 0;
        $count = $result[0]['comeback_count'] ?? 0;
        
        return [
            'percent' => $total > 0 ? round($count / $total, 3) : 0,
            'count' => (int)$count,
            'total' => (int)$total
        ];
    }
    
    /**
     * Blown lead statisztikák számítása
     */
    private function calculateBlownLeadStats($team, $resultType) {
        $sql = "
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE 
                    WHEN (home_team = ? AND half_time_home_goals > half_time_away_goals AND 
                          (? = 'loss' AND full_time_home_goals < full_time_away_goals OR
                           ? = 'draw' AND full_time_home_goals = full_time_away_goals))
                    OR (away_team = ? AND half_time_away_goals > half_time_home_goals AND 
                        (? = 'loss' AND full_time_away_goals < full_time_home_goals OR
                         ? = 'draw' AND full_time_away_goals = full_time_home_goals))
                    THEN 1 END) as blown_lead_count
            FROM matches 
            WHERE (home_team = ? OR away_team = ?) 
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 20
        ";
        
        $result = $this->supabase->query($sql, [
            $team, $resultType, $resultType, $team, $resultType, $resultType, $team, $team
        ]);
        
        $total = $result[0]['total_matches'] ?? 0;
        $count = $result[0]['blown_lead_count'] ?? 0;
        
        return [
            'percent' => $total > 0 ? round($count / $total, 3) : 0,
            'count' => (int)$count,
            'total' => (int)$total
        ];
    }
    
    /**
     * Forma index számítása
     */
    private function calculateFormIndex($team, $venue = 'overall') {
        $venueCondition = '';
        $limit = 5;
        
        if ($venue === 'home') {
            $venueCondition = 'AND home_team = ?';
            $limit = 5;
        } elseif ($venue === 'away') {
            $venueCondition = 'AND away_team = ?';
            $limit = 5;
        } else {
            $venueCondition = 'AND (home_team = ? OR away_team = ?)';
        }
        
        $sql = "
            SELECT 
                home_team, away_team, 
                full_time_home_goals, full_time_away_goals
            FROM matches 
            WHERE league = 'spain' $venueCondition
            ORDER BY created_at DESC 
            LIMIT $limit
        ";
        
        $params = $venue === 'overall' ? [$team, $team] : [$team];
        $matches = $this->supabase->query($sql, $params);
        
        $points = 0;
        $maxPoints = count($matches) * 3;
        
        foreach ($matches as $match) {
            $isHome = $match['home_team'] === $team;
            $teamGoals = $isHome ? $match['full_time_home_goals'] : $match['full_time_away_goals'];
            $opponentGoals = $isHome ? $match['full_time_away_goals'] : $match['full_time_home_goals'];
            
            if ($teamGoals > $opponentGoals) {
                $points += 3; // Győzelem
            } elseif ($teamGoals === $opponentGoals) {
                $points += 1; // Döntetlen
            }
            // Vereség = 0 pont
        }
        
        return [
            'value' => $maxPoints > 0 ? round($points / $maxPoints, 3) : 0,
            'points' => $points,
            'max_points' => $maxPoints,
            'matches_count' => count($matches)
        ];
    }
    
    /**
     * Gólátlag számítása
     */
    private function calculateGoalAverage($team, $venue, $type) {
        $venueCondition = $venue === 'home' ? 'home_team = ?' : 'away_team = ?';
        
        $sql = "
            SELECT 
                AVG(CASE WHEN ? = 'home' THEN 
                    (CASE WHEN ? = 'scored' THEN full_time_home_goals ELSE full_time_away_goals END)
                ELSE 
                    (CASE WHEN ? = 'scored' THEN full_time_away_goals ELSE full_time_home_goals END)
                END) as avg_goals,
                COUNT(*) as total_matches
            FROM matches 
            WHERE $venueCondition AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 10
        ";
        
        $result = $this->supabase->query($sql, [$venue, $type, $type, $team]);
        
        return [
            'value' => round($result[0]['avg_goals'] ?? 0, 2),
            'matches_count' => (int)($result[0]['total_matches'] ?? 0)
        ];
    }
    
    /**
     * BTTS arány számítása
     */
    private function calculateBTTSRatio($team) {
        $sql = "
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE WHEN full_time_home_goals > 0 AND full_time_away_goals > 0 THEN 1 END) as btts_count
            FROM matches 
            WHERE (home_team = ? OR away_team = ?) 
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 10
        ";
        
        $result = $this->supabase->query($sql, [$team, $team]);
        
        $total = $result[0]['total_matches'] ?? 0;
        $count = $result[0]['btts_count'] ?? 0;
        
        return [
            'percent' => $total > 0 ? round($count / $total, 3) : 0,
            'count' => (int)$count,
            'total' => (int)$total
        ];
    }
    
    /**
     * Over/Under arány számítása
     */
    private function calculateOverUnderRatio($team, $threshold, $type) {
        $condition = $type === 'over' ? '>' : '<=';
        
        $sql = "
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE WHEN (full_time_home_goals + full_time_away_goals) $condition ? THEN 1 END) as target_count
            FROM matches 
            WHERE (home_team = ? OR away_team = ?) 
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 10
        ";
        
        $result = $this->supabase->query($sql, [$threshold, $team, $team]);
        
        $total = $result[0]['total_matches'] ?? 0;
        $count = $result[0]['target_count'] ?? 0;
        
        return [
            'percent' => $total > 0 ? round($count / $total, 3) : 0,
            'count' => (int)$count,
            'total' => (int)$total
        ];
    }
    
    /**
     * Félidő statisztikák
     */
    private function calculateHalftimeStats($team, $type) {
        $condition = '';
        if ($type === 'lead') {
            $condition = "(home_team = ? AND half_time_home_goals > half_time_away_goals) OR (away_team = ? AND half_time_away_goals > half_time_home_goals)";
        } elseif ($type === 'draw') {
            $condition = "half_time_home_goals = half_time_away_goals";
        }
        
        $sql = "
            SELECT 
                COUNT(*) as total_matches,
                COUNT(CASE WHEN $condition THEN 1 END) as target_count
            FROM matches 
            WHERE (home_team = ? OR away_team = ?) 
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 10
        ";
        
        $params = $type === 'lead' ? [$team, $team, $team, $team] : [$team, $team];
        $result = $this->supabase->query($sql, $params);
        
        $total = $result[0]['total_matches'] ?? 0;
        $count = $result[0]['target_count'] ?? 0;
        
        return [
            'percent' => $total > 0 ? round($count / $total, 3) : 0,
            'count' => (int)$count,
            'total' => (int)$total
        ];
    }
    
    /**
     * Head-to-head statisztikák
     */
    private function calculateHeadToHeadStats($homeTeam, $awayTeam) {
        $sql = "
            SELECT 
                home_team, away_team,
                full_time_home_goals, full_time_away_goals,
                (full_time_home_goals + full_time_away_goals) as total_goals
            FROM matches 
            WHERE ((home_team = ? AND away_team = ?) OR (home_team = ? AND away_team = ?))
            AND league = 'spain'
            ORDER BY created_at DESC 
            LIMIT 5
        ";
        
        $matches = $this->supabase->query($sql, [$homeTeam, $awayTeam, $awayTeam, $homeTeam]);
        
        $homeWins = 0;
        $draws = 0;
        $awayWins = 0;
        $totalGoals = 0;
        $totalMatches = count($matches);
        
        foreach ($matches as $match) {
            $homeGoals = $match['full_time_home_goals'];
            $awayGoals = $match['full_time_away_goals'];
            $totalGoals += $match['total_goals'];
            
            if ($match['home_team'] === $homeTeam) {
                // Hazai csapat hazai pályán
                if ($homeGoals > $awayGoals) $homeWins++;
                elseif ($homeGoals === $awayGoals) $draws++;
                else $awayWins++;
            } else {
                // Hazai csapat idegen pályán
                if ($awayGoals > $homeGoals) $homeWins++;
                elseif ($homeGoals === $awayGoals) $draws++;
                else $awayWins++;
            }
        }
        
        return [
            'home_win_ratio' => $totalMatches > 0 ? round($homeWins / $totalMatches, 3) : 0,
            'draw_ratio' => $totalMatches > 0 ? round($draws / $totalMatches, 3) : 0,
            'away_win_ratio' => $totalMatches > 0 ? round($awayWins / $totalMatches, 3) : 0,
            'avg_goals' => $totalMatches > 0 ? round($totalGoals / $totalMatches, 2) : 0,
            'total_matches' => $totalMatches,
            'home_wins' => $homeWins,
            'draws' => $draws,
            'away_wins' => $awayWins
        ];
    }
    
    /**
     * Hazai pálya előny számítása
     */
    private function calculateHomeAdvantage($team) {
        // Hazai meccsek átlaga
        $homeStats = $this->calculateGoalAverage($team, 'home', 'scored');
        $homeConceeded = $this->calculateGoalAverage($team, 'home', 'conceded');
        
        // Idegen meccsek átlaga
        $awayStats = $this->calculateGoalAverage($team, 'away', 'scored');
        $awayConceeded = $this->calculateGoalAverage($team, 'away', 'conceded');
        
        $homeAdvantageGoals = ($homeStats['value'] - $awayStats['value']) + 
                             ($awayConceeded['value'] - $homeConceeded['value']);
        
        return [
            'value' => round($homeAdvantageGoals, 3),
            'home_scored' => $homeStats['value'],
            'away_scored' => $awayStats['value'],
            'home_conceded' => $homeConceeded['value'],
            'away_conceded' => $awayConceeded['value']
        ];
    }
}
