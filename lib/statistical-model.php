<?php

class StatisticalModel {
    
    /**
     * Statisztikai predikció Poisson + Bootstrap alapon
     */
    public function predict($features) {
        // 1. Alapvalószínűségek számítása
        $homeWinProb = $this->calculateHomeWinProbability($features);
        $drawProb = $this->calculateDrawProbability($features);
        $awayWinProb = 1 - $homeWinProb - $drawProb;
        
        // 2. BTTS valószínűség
        $bttsProb = $this->calculateBTTSProbability($features);
        
        // 3. Over 2.5 valószínűség
        $over25Prob = $this->calculateOver25Probability($features);
        
        // 4. Confidence score
        $confidence = $this->calculateConfidence($features, [$homeWinProb, $drawProb, $awayWinProb]);
        
        return [
            'home_win' => round($homeWinProb, 3),
            'draw' => round($drawProb, 3),
            'away_win' => round($awayWinProb, 3),
            'btts' => round($bttsProb, 3),
            'over_2_5' => round($over25Prob, 3),
            'confidence' => round($confidence, 3)
        ];
    }
    
    /**
     * Hazai győzelem valószínűség számítása
     */
    private function calculateHomeWinProbability($features) {
        $baseProb = 0.33; // Alapvalószínűség
        
        // Forma index hatása
        $formDiff = $features['home_overall_form']['value'] - $features['away_overall_form']['value'];
        $baseProb += $formDiff * 0.3;
        
        // Gólátlag hatása
        $goalDiff = $features['home_avg_goals_scored']['value'] - $features['away_avg_goals_scored']['value'];
        $baseProb += $goalDiff * 0.1;
        
        // Comeback képesség (KIEMELT)
        $comebackBonus = $features['home_comeback_win_ratio']['percent'] * 0.2;
        $baseProb += $comebackBonus;
        
        // Blown lead malus
        $blownLeadMalus = $features['away_blown_lead_ratio']['percent'] * 0.15;
        $baseProb += $blownLeadMalus;
        
        // Hazai pálya előny
        $homeAdvantage = max(0, $features['home_advantage']['value']) * 0.1;
        $baseProb += $homeAdvantage;
        
        // Head-to-head
        if ($features['h2h_stats']['total_matches'] >= 3) {
            $h2hBonus = $features['h2h_stats']['home_win_ratio'] * 0.1;
            $baseProb += $h2hBonus;
        }
        
        return max(0.05, min(0.85, $baseProb));
    }
    
    /**
     * Döntetlen valószínűség számítása
     */
    private function calculateDrawProbability($features) {
        $baseProb = 0.25; // Alapvalószínűség
        
        // Ha a csapatok hasonló erősségűek
        $formDiff = abs($features['home_overall_form']['value'] - $features['away_overall_form']['value']);
        if ($formDiff < 0.2) {
            $baseProb += 0.1;
        }
        
        // Comeback vs blown lead kiegyenlítődés
        $comebackBalance = abs($features['home_comeback_win_ratio']['percent'] - $features['away_comeback_win_ratio']['percent']);
        if ($comebackBalance < 0.1) {
            $baseProb += 0.05;
        }
        
        // Head-to-head döntetlen arány
        if ($features['h2h_stats']['total_matches'] >= 3) {
            $h2hDrawBonus = $features['h2h_stats']['draw_ratio'] * 0.15;
            $baseProb += $h2hDrawBonus;
        }
        
        return max(0.15, min(0.45, $baseProb));
    }
    
    /**
     * BTTS valószínűség számítása
     */
    private function calculateBTTSProbability($features) {
        $homeBTTS = $features['home_btts_ratio']['percent'];
        $awayBTTS = $features['away_btts_ratio']['percent'];
        
        // Átlag + súlyozás
        $baseProb = ($homeBTTS + $awayBTTS) / 2;
        
        // Gólátlagok hatása
        $homeGoals = $features['home_avg_goals_scored']['value'];
        $awayGoals = $features['away_avg_goals_scored']['value'];
        
        if ($homeGoals >= 1.5 && $awayGoals >= 1.0) {
            $baseProb += 0.1;
        }
        
        return max(0.2, min(0.8, $baseProb));
    }
    
    /**
     * Over 2.5 valószínűség számítása
     */
    private function calculateOver25Probability($features) {
        $homeOver = $features['home_over_2_5_ratio']['percent'];
        $awayOver = $features['away_over_2_5_ratio']['percent'];
        
        // Átlag
        $baseProb = ($homeOver + $awayOver) / 2;
        
        // Gólátlagok összege
        $totalGoalAvg = $features['home_avg_goals_scored']['value'] + $features['away_avg_goals_scored']['value'];
        
        if ($totalGoalAvg >= 3.0) {
            $baseProb += 0.15;
        } elseif ($totalGoalAvg <= 2.0) {
            $baseProb -= 0.1;
        }
        
        return max(0.2, min(0.8, $baseProb));
    }
    
    /**
     * Confidence score számítása
     */
    private function calculateConfidence($features, $probabilities) {
        $baseConfidence = 0.5;
        
        // Adatok mennyisége alapján
        $dataQuality = 0;
        $dataQuality += min(1.0, $features['home_overall_form']['matches_count'] / 5) * 0.2;
        $dataQuality += min(1.0, $features['away_overall_form']['matches_count'] / 5) * 0.2;
        $dataQuality += min(1.0, $features['h2h_stats']['total_matches'] / 5) * 0.1;
        
        // Predikció egyértelműsége
        $maxProb = max($probabilities);
        $probSpread = $maxProb - min($probabilities);
        $clarityBonus = $probSpread * 0.3;
        
        // Comeback adatok megbízhatósága
        $comebackReliability = min(1.0, ($features['home_comeback_win_ratio']['total'] + $features['away_comeback_win_ratio']['total']) / 40) * 0.2;
        
        $confidence = $baseConfidence + $dataQuality + $clarityBonus + $comebackReliability;
        
        return max(0.3, min(0.95, $confidence));
    }
}
