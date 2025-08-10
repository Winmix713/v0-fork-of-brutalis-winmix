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
    
    if (!$homeTeam || !$awayTeam) {
        throw new Exception('home_team és away_team paraméterek szükségesek');
    }
    
    // Supabase kapcsolat
    $supabase = new SupabaseClient();
    
    // Cache ellenőrzés
    $cacheKey = md5($homeTeam . '_vs_' . $awayTeam);
    $cachedPrediction = $supabase->getCachedPrediction($cacheKey);
    
    if ($cachedPrediction && !isExpired($cachedPrediction['expires_at'])) {
        echo json_encode($cachedPrediction['prediction']);
        exit;
    }
    
    // Feature extraction
    $featureExtractor = new FeatureExtractor($supabase);
    $features = $featureExtractor->extractAllFeatures($homeTeam, $awayTeam);
    
    // Predikció számítása
    $model = new StatisticalModel();
    $prediction = $model->predict($features);
    
    // Válasz összeállítása
    $response = [
        'features' => [
            'comeback_win_ratio' => $features['home_comeback_win_ratio'],
            'form_index' => $features['home_overall_form'],
            'btts_ratio' => $features['home_btts_ratio'],
            'over_2_5_ratio' => $features['home_over_2_5_ratio'],
            'h2h_stats' => $features['h2h_stats'],
            'home_advantage' => $features['home_advantage']
        ],
        'prediction' => $prediction,
        'meta' => [
            'home_team' => $homeTeam,
            'away_team' => $awayTeam,
            'model_version' => 'statistical_v1',
            'generated_at' => date('Y-m-d H:i:s'),
            'cache_key' => $cacheKey
        ]
    ];
    
    // Cache mentése
    $supabase->savePrediction($cacheKey, $response, $homeTeam, $awayTeam);
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => 'PREDICTION_ERROR'
    ]);
}

function isExpired($expiresAt) {
    return strtotime($expiresAt) < time();
}
