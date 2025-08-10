<?php

declare(strict_types=1);

namespace FootballAPI\Features;

use \PDO;
use \PDOException;
use \DateTime;
use \Exception;

class BatchFeatureExtractor {
    private PDO $db;
    private string $league;
    private string $sqlPath;
    
    public function __construct(PDO $pdo, string $league = 'spain', string $sqlPath = null) {
        $this->db = $pdo;
        $this->league = $league;
        $this->sqlPath = $sqlPath ?? __DIR__ . '/../sql/calculate_all_features_batch.sql';
    }
    
    /**
     * Beast Mode: Single query feature extraction
     */
    public function calculateAllFeaturesBatch(string $homeTeam, string $awayTeam): array {
        $startTime = microtime(true);
        
        try {
            // Load batch SQL
            if (!file_exists($this->sqlPath)) {
                throw new Exception("Batch SQL file not found: {$this->sqlPath}");
            }
            
            $sql = file_get_contents($this->sqlPath);
            
            // Execute batch query
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':league', $this->league, PDO::PARAM_STR);
            $stmt->bindValue(':home_team', $homeTeam, PDO::PARAM_STR);
            $stmt->bindValue(':away_team', $awayTeam, PDO::PARAM_STR);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_NUM);
            $featuresJson = $row[0] ?? null;
            
            if (!$featuresJson) {
                throw new Exception("No data returned from batch query");
            }
            
            $features = json_decode($featuresJson, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSON decode error: " . json_last_error_msg());
            }
            
            // Calculate prediction from features
            $prediction = $this->calculatePredictionFromFeatures($features);
            
            $duration = microtime(true) - $startTime;
            
            return [
                'features' => $features,
                'prediction' => $prediction,
                'meta' => [
                    'execution_time_ms' => round($duration * 1000, 2),
                    'method' => 'batch_sql',
                    'model_version' => 'batch_sql_v1'
                ]
            ];
            
        } catch (PDOException $e) {
            throw new Exception("Database error in batch feature extraction: " . $e->getMessage());
        }
    }
    
    /**
     * Calculate prediction from extracted features
     */
    private function calculatePredictionFromFeatures(array $features): array {
        $home = $features['home'] ?? [];
        $away = $features['away'] ?? [];
        $h2h = $features['h2h'] ?? [];
        
        // Base expected goals
        $homeExpected = max(0.1, (float)($home['avg_scored'] ?? 0.9));
        $awayExpected = max(0.1, (float)($away['avg_scored'] ?? 0.8));
        
        // Form adjustment
        $homeForm = (float)($home['form_index'] ?? 0.5);
        $awayForm = (float)($away['form_index'] ?? 0.5);
        
        // Comeback factor (KIEMELT)
        $homeComebackBonus = (float)($home['comeback_ratio'] ?? 0) * 0.2;
        $awayComebackBonus = (float)($away['comeback_ratio'] ?? 0) * 0.2;
        
        // Blown leads malus
        $homeBlownMalus = (float)($home['blown_leads_ratio'] ?? 0) * 0.15;
        $awayBlownMalus = (float)($away['blown_leads_ratio'] ?? 0) * 0.15;
        
        // Adjusted expected goals
        $homeAdjusted = $homeExpected * (1 + ($homeForm - 0.5)) + $homeComebackBonus - $homeBlownMalus;
        $awayAdjusted = $awayExpected * (1 + ($awayForm - 0.5)) + $awayComebackBonus - $awayBlownMalus;
        
        $homeAdjusted = max(0.1, $homeAdjusted);
        $awayAdjusted = max(0.1, $awayAdjusted);
        
        // Win probabilities (simplified Poisson approximation)
        $total = $homeAdjusted + $awayAdjusted;
        $homeWin = $homeAdjusted / $total;
        $awayWin = $awayAdjusted / $total;
        $draw = max(0.15, 1 - ($homeWin + $awayWin)); // Minimum 15% draw chance
        
        // Normalize
        $sum = $homeWin + $draw + $awayWin;
        $homeWin = $homeWin / $sum;
        $draw = $draw / $sum;
        $awayWin = $awayWin / $sum;
        
        // BTTS probability
        $homeBtts = (float)($home['btts_rate'] ?? 0.5);
        $awayBtts = (float)($away['btts_rate'] ?? 0.5);
        $btts = ($homeBtts + $awayBtts) / 2;
        
        // Over 2.5 probability
        $homeOver25 = (float)($home['over25_rate'] ?? 0.5);
        $awayOver25 = (float)($away['over25_rate'] ?? 0.5);
        $over25 = ($homeOver25 + $awayOver25) / 2;
        
        // Confidence calculation
        $confidence = $this->calculateConfidence($home, $away, $h2h);
        
        return [
            'home_win' => round($homeWin, 3),
            'draw' => round($draw, 3),
            'away_win' => round($awayWin, 3),
            'btts' => round($btts, 3),
            'over_2_5' => round($over25, 3),
            'confidence' => round($confidence, 3),
            'expected_goals' => [
                'home' => round($homeAdjusted, 2),
                'away' => round($awayAdjusted, 2)
            ]
        ];
    }
    
    /**
     * Calculate confidence score
     */
    private function calculateConfidence(array $home, array $away, array $h2h): float {
        $homeMatches = (int)($home['total_matches'] ?? 0);
        $awayMatches = (int)($away['total_matches'] ?? 0);
        $h2hMatches = (int)($h2h['total_matches'] ?? 0);
        
        // Data coverage (0-1)
        $coverage = min(1.0, ($homeMatches + $awayMatches + $h2hMatches * 2) / 100.0);
        
        // Form consistency
        $homeForm = (float)($home['form_index'] ?? 0.5);
        $awayForm = (float)($away['form_index'] ?? 0.5);
        $formConsistency = 1 - abs($homeForm - $awayForm);
        
        // Base confidence
        $confidence = 0.3 + ($coverage * 0.4) + ($formConsistency * 0.3);
        
        return max(0.3, min(0.95, $confidence));
    }
    
    /**
     * Cache result in predictions table
     */
    public function cacheResult(string $homeTeam, string $awayTeam, array $result, int $ttlHours = 24): bool {
        try {
            $sql = "
                INSERT INTO public.predictions (league, home_team, away_team, expires_at, features, prediction, model_version)
                VALUES (:league, :home, :away, (now() + interval '{$ttlHours} hours'), :features::jsonb, :prediction::jsonb, :model_version)
                ON CONFLICT ON CONSTRAINT predictions_unique_idx DO UPDATE SET
                    expires_at = (now() + interval '{$ttlHours} hours'),
                    features = EXCLUDED.features,
                    prediction = EXCLUDED.prediction,
                    model_version = EXCLUDED.model_version,
                    generated_at = now()
            ";
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':league' => $this->league,
                ':home' => $homeTeam,
                ':away' => $awayTeam,
                ':features' => json_encode($result['features'], JSON_UNESCAPED_UNICODE),
                ':prediction' => json_encode($result['prediction'], JSON_UNESCAPED_UNICODE),
                ':model_version' => $result['meta']['model_version'] ?? 'batch_sql_v1'
            ]);
            
        } catch (PDOException $e) {
            error_log("Cache error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get cached result if valid
     */
    public function getCachedResult(string $homeTeam, string $awayTeam): ?array {
        try {
            $sql = "
                SELECT features, prediction, generated_at, model_version
                FROM public.predictions
                WHERE league = :league 
                  AND lower(home_team) = lower(:home)
                  AND lower(away_team) = lower(:away)
                  AND (expires_at IS NULL OR expires_at > now())
                ORDER BY generated_at DESC
                LIMIT 1
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':league' => $this->league,
                ':home' => $homeTeam,
                ':away' => $awayTeam
            ]);
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return null;
            }
            
            return [
                'features' => json_decode($row['features'], true),
                'prediction' => json_decode($row['prediction'], true),
                'meta' => [
                    'cached' => true,
                    'generated_at' => $row['generated_at'],
                    'model_version' => $row['model_version']
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Cache retrieval error: " . $e->getMessage());
            return null;
        }
    }
}
