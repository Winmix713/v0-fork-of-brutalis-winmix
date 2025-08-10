<?php

require_once '../lib/feature-extractor.php';
require_once '../lib/statistical-model.php';
require_once '../lib/supabase-client.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Paraméterek
    $homeTeam = $_GET['home_team'] ?? null;
    $awayTeam = $_GET['away_team'] ?? null;
    $matchDate = $_GET['match_date'] ?? date('Y-m-d');
    
    if (!$homeTeam || !$awayTeam) {
        throw new Exception('home_team és away_team paraméterek szükségesek');
    }
    
    // Supabase kapcsolat
    $supabase = new SupabaseClient();
    
    // Cache ellenőrzés
    $cacheKey = md5($homeTeam . '_vs_' . $awayTeam . '_' . $matchDate);
    $cachedPrediction = $supabase->getCachedPrediction($cacheKey);
    
    if ($cachedPrediction && !isExpired($cachedPrediction['expires_at'])) {
        echo json_encode($cachedPrediction['prediction']);
        exit;
    }
    
    // Feature extraction
    $featureExtractor = new FeatureExtractor($supabase);
    $features = $featureExtractor->extractEnhancedFeatures($homeTeam, $awayTeam);
    
    // Model calculations
    $model = new StatisticalModel();
    
    // Form-based prediction
    $formPrediction = $model->predictFormBased($features);
    
    // H2H-based prediction
    $h2hPrediction = $model->predictH2HBased($features);
    
    // Default ensemble (60% form, 40% h2h)
    $ensemblePrediction = $model->blendPredictions($formPrediction, $h2hPrediction, 0.6);
    
    // Calculate confidence score
    $confidence = calculateConfidence($features, $formPrediction, $h2hPrediction);
    
    // Válasz összeállítása
    $response = [
        'model_version' => 'enhanced_stat_v1.1',
        'features' => [
            'home' => [
                'form_index' => [
                    'value' => round($features['home_overall_form'] * 100, 1),
                    'window' => 10
                ],
                'comeback_win_ratio' => [
                    'percent' => round($features['home_comeback_win_ratio'], 3),
                    'count' => $features['home_comeback_count'] ?? 0,
                    'total' => $features['home_total_matches'] ?? 0
                ],
                'avg_goals' => round($features['home_avg_goals_scored'], 2),
                'btts_rate' => round($features['home_btts_ratio'], 3),
                'over_25_rate' => round($features['home_over_2_5_ratio'], 3)
            ],
            'away' => [
                'form_index' => [
                    'value' => round($features['away_overall_form'] * 100, 1),
                    'window' => 10
                ],
                'comeback_win_ratio' => [
                    'percent' => round($features['away_comeback_win_ratio'], 3),
                    'count' => $features['away_comeback_count'] ?? 0,
                    'total' => $features['away_total_matches'] ?? 0
                ],
                'avg_goals' => round($features['away_avg_goals_scored'], 2),
                'btts_rate' => round($features['away_btts_ratio'], 3),
                'over_25_rate' => round($features['away_over_2_5_ratio'], 3)
            ],
            'h2h_summary' => [
                'matches' => $features['h2h_stats']['total_matches'] ?? 0,
                'home_wins' => $features['h2h_stats']['home_wins'] ?? 0,
                'away_wins' => $features['h2h_stats']['away_wins'] ?? 0,
                'draws' => $features['h2h_stats']['draws'] ?? 0,
                'comeback_count' => $features['h2h_stats']['comeback_count'] ?? 0,
                'avg_goals' => $features['h2h_stats']['avg_goals'] ?? 0
            ]
        ],
        'predictions' => [
            'form' => [
                'home' => round($formPrediction['home_win'], 3),
                'draw' => round($formPrediction['draw'], 3),
                'away' => round($formPrediction['away_win'], 3),
                'btts' => round($formPrediction['btts'], 3),
                'over_25' => round($formPrediction['over_25'], 3),
                'expected_goals' => [
                    'home' => round($formPrediction['expected_goals_home'], 2),
                    'away' => round($formPrediction['expected_goals_away'], 2)
                ]
            ],
            'h2h' => [
                'home' => round($h2hPrediction['home_win'], 3),
                'draw' => round($h2hPrediction['draw'], 3),
                'away' => round($h2hPrediction['away_win'], 3),
                'btts' => round($h2hPrediction['btts'], 3),
                'over_25' => round($h2hPrediction['over_25'], 3),
                'expected_goals' => [
                    'home' => round($h2hPrediction['expected_goals_home'], 2),
                    'away' => round($h2hPrediction['expected_goals_away'], 2)
                ]
            ],
            'ensemble' => [
                'home' => round($ensemblePrediction['home_win'], 3),
                'draw' => round($ensemblePrediction['draw'], 3),
                'away' => round($ensemblePrediction['away_win'], 3),
                'btts' => round($ensemblePrediction['btts'], 3),
                'over_25' => round($ensemblePrediction['over_25'], 3),
                'expected_goals' => [
                    'home' => round($ensemblePrediction['expected_goals_home'], 2),
                    'away' => round($ensemblePrediction['expected_goals_away'], 2)
                ]
            ]
        ],
        'confidence' => round($confidence, 3),
        'meta' => [
            'home_team' => $homeTeam,
            'away_team' => $awayTeam,
            'match_date' => $matchDate,
            'generated_at' => date('c'),
            'cache_key' => $cacheKey,
            'data_quality' => [
                'home_matches' => $features['home_total_matches'] ?? 0,
                'away_matches' => $features['away_total_matches'] ?? 0,
                'h2h_matches' => $features['h2h_stats']['total_matches'] ?? 0
            ]
        ]
    ];
    
    // Cache mentése
    $supabase->saveEnhancedPrediction($cacheKey, $response, $homeTeam, $awayTeam, $matchDate);
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => 'ENHANCED_PREDICTION_ERROR',
        'timestamp' => date('c')
    ]);
}

function isExpired($expiresAt) {
    return strtotime($expiresAt) < time();
}

function calculateConfidence($features, $formPred, $h2hPred) {
    $baseConfidence = 0.5;
    
    // Data quality boost
    $homeMatches = $features['home_total_matches'] ?? 0;
    $awayMatches = $features['away_total_matches'] ?? 0;
    $h2hMatches = $features['h2h_stats']['total_matches'] ?? 0;
    
    $dataQuality = min(1.0, ($homeMatches + $awayMatches) / 40);
    $h2hBonus = min(0.2, $h2hMatches / 10);
    
    // Model agreement boost
    $formHome = $formPred['home_win'];
    $h2hHome = $h2hPred['home_win'];
    $agreement = 1 - abs($formHome - $h2hHome);
    
    $confidence = $baseConfidence + ($dataQuality * 0.3) + $h2hBonus + ($agreement * 0.2);
    
    return min(0.95, max(0.1, $confidence));
}
?>
