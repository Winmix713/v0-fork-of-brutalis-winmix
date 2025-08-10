<?php

// Clean output buffer to prevent JSON parsing errors
ob_clean();
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Suppress PHP warnings that could break JSON
error_reporting(E_ERROR | E_PARSE);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Parameters
    $homeTeam = trim($_GET['home_team'] ?? '');
    $awayTeam = trim($_GET['away_team'] ?? '');
    $userSession = $_GET['session_id'] ?? generateSessionId();
    $useCache = ($_GET['cache'] ?? 'true') === 'true';
    $league = $_GET['league'] ?? 'spain';
    
    if (empty($homeTeam) || empty($awayTeam)) {
        throw new Exception('home_team and away_team parameters required');
    }
    
    // A/B Testing: Determine variant
    $variant = determineABVariant($userSession);
    
    // Execute LEGEND MODE analysis with monitoring
    $result = executeLegendModeWithMonitoring($homeTeam, $awayTeam, $league, $userSession, $variant);
    
    // Log baseline data for GODMODE comparison
    logBaselineData($homeTeam, $awayTeam, $league, $result, $variant, $userSession);
    
    // Update team resilience tracking
    updateTeamResilienceTracking($homeTeam, $awayTeam, $league, $result);
    
    // Check for alerts
    checkAndSendAlerts($homeTeam, $awayTeam, $league);
    
    // Add variant info to response
    $result['meta']['ab_variant'] = $variant;
    $result['meta']['session_id'] = $userSession;
    
    // Ensure clean JSON output
    $jsonOutput = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($jsonOutput === false) {
        http_response_code(500);
        echo json_encode(['error' => 'JSON encoding failed', 'code' => 'JSON_ENCODE_ERROR']);
    } else {
        echo $jsonOutput;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => 'LEGEND_ENTERPRISE_ERROR',
        'timestamp' => date('c')
    ], JSON_PRETTY_PRINT);
}

function determineABVariant($sessionId) {
    // Simple hash-based A/B testing
    $hash = crc32($sessionId) % 100;
    
    if ($hash < 50) return 'legend_v1_purple_orange';
    if ($hash < 75) return 'legend_v1_blue_green';
    return 'legend_v1_minimal';
}

function executeLegendModeWithMonitoring($homeTeam, $awayTeam, $league, $sessionId, $variant) {
    $startTime = microtime(true);
    
    // Execute core LEGEND MODE logic
    $result = executeLegendModeAnalysis($homeTeam, $awayTeam, $league);
    
    // Add monitoring metadata
    $executionTime = microtime(true) - $startTime;
    $result['meta']['execution_time_ms'] = round($executionTime * 1000, 2);
    $result['meta']['monitoring_enabled'] = true;
    $result['meta']['baseline_logged'] = true;
    
    return $result;
}

function logBaselineData($homeTeam, $awayTeam, $league, $result, $variant, $sessionId) {
    // Mock database logging - replace with actual DB call
    $logData = [
        'league' => $league,
        'home_team' => $homeTeam,
        'away_team' => $awayTeam,
        'comeback_frequency_home' => $result['home']['comeback_breakdown']['comeback_frequency'],
        'comeback_frequency_away' => $result['away']['comeback_breakdown']['comeback_frequency'],
        'resilience_score_home' => $result['home']['mental_strength']['resilience_score'],
        'resilience_score_away' => $result['away']['mental_strength']['resilience_score'],
        'legend_score_home' => $result['legend_mode_insights']['legend_score']['home'],
        'legend_score_away' => $result['legend_mode_insights']['legend_score']['away'],
        'execution_time_ms' => $result['meta']['execution_time_ms'],
        'api_version' => 'legend_enterprise_v1',
        'ui_variant' => $variant,
        'user_session_id' => $sessionId,
        'logged_at' => date('c')
    ];
    
    // In production: INSERT INTO legend_baseline_logs
    error_log("LEGEND BASELINE LOG: " . json_encode($logData));
    
    return true;
}

function updateTeamResilienceTracking($homeTeam, $awayTeam, $league, $result) {
    // Update tracking for both teams
    $teams = [
        $homeTeam => $result['home'],
        $awayTeam => $result['away']
    ];
    
    foreach ($teams as $teamName => $teamData) {
        $trackingData = [
            'league' => $league,
            'team_name' => $teamName,
            'resilience_score' => $teamData['mental_strength']['resilience_score'],
            'comeback_frequency' => $teamData['comeback_breakdown']['comeback_frequency'],
            'legend_score' => $result['legend_mode_insights']['legend_score'][
                $teamName === $homeTeam ? 'home' : 'away'
            ]
        ];
        
        // In production: Call update_team_resilience() function
        error_log("RESILIENCE TRACKING: " . json_encode($trackingData));
    }
    
    return true;
}

function checkAndSendAlerts($homeTeam, $awayTeam, $league) {
    // Mock alert checking - in production, query team_resilience_tracking
    $alertsToSend = [];
    
    // Simulate significant change detection
    if (rand(1, 100) <= 5) { // 5% chance for demo
        $alertsToSend[] = [
            'type' => 'resilience_change',
            'team' => $homeTeam,
            'change_percent' => rand(25, 45),
            'new_score' => rand(60, 90),
            'message' => "LEGEND ALERT: {$homeTeam} resilience score changed significantly"
        ];
    }
    
    foreach ($alertsToSend as $alert) {
        sendAlert($alert);
    }
    
    return count($alertsToSend);
}

function sendAlert($alert) {
    // Mock alert sending - replace with actual Slack/Email integration
    $alertData = [
        'timestamp' => date('c'),
        'alert_type' => $alert['type'],
        'team' => $alert['team'],
        'message' => $alert['message'],
        'severity' => 'medium',
        'requires_action' => false
    ];
    
    error_log("LEGEND ALERT SENT: " . json_encode($alertData));
    
    // In production:
    // - Send to Slack webhook
    // - Send email notifications
    // - Update alert_sent flag in database
    
    return true;
}

function generateSessionId() {
    return 'legend_' . uniqid() . '_' . substr(md5(microtime()), 0, 8);
}

function executeLegendModeAnalysis($homeTeam, $awayTeam, $league) {
    // Core LEGEND MODE logic (same as before)
    $startTime = microtime(true);
    
    $legendData = generateLegendModeData($homeTeam, $awayTeam, $league);
    $insights = calculateLegendModeInsights($legendData);
    
    return [
        'home' => $legendData['home'],
        'away' => $legendData['away'],
        'h2h_comeback_analysis' => $legendData['h2h'],
        'legend_mode_insights' => $insights,
        'meta' => [
            'generated_at' => date('c'),
            'model_version' => 'legend_enterprise_v1',
            'league' => $league,
            'home_team' => $homeTeam,
            'away_team' => $awayTeam,
            'analysis_depth' => 'legend_mode_enterprise_monitoring'
        ]
    ];
}

function generateLegendModeData($homeTeam, $awayTeam, $league) {
    // Same as previous implementation
    $homeStrength = getTeamStrength($homeTeam);
    $awayStrength = getTeamStrength($awayTeam);
    
    return [
        'home' => [
            'basic_stats' => [
                'total_matches' => rand(25, 35),
                'form_index' => round($homeStrength + (rand(-100, 100) / 1000), 3)
            ],
            'comeback_breakdown' => [
                'comeback_wins' => rand(2, 6),
                'comeback_draws' => rand(1, 3),
                'total_comebacks' => rand(3, 8),
                'comeback_frequency' => round(rand(150, 280) / 1000, 3),
                'comeback_success_rate' => round(rand(600, 850) / 1000, 3)
            ],
            'comeback_by_deficit' => [
                'from_1goal' => rand(2, 5),
                'from_2goal' => rand(1, 3),
                'from_3plus_goal' => rand(0, 1),
                'max_deficit_overcome' => rand(2, 4)
            ],
            'blown_leads' => [
                'blown_lead_losses' => rand(1, 3),
                'blown_lead_draws' => rand(1, 2),
                'blown_lead_frequency' => round(rand(80, 150) / 1000, 3)
            ],
            'mental_strength' => [
                'avg_comeback_margin' => round(rand(100, 200) / 100, 2),
                'resilience_score' => round(($homeStrength - 0.3) + (rand(-100, 200) / 1000), 3)
            ]
        ],
        'away' => [
            'basic_stats' => [
                'total_matches' => rand(25, 35),
                'form_index' => round($awayStrength + (rand(-100, 100) / 1000), 3)
            ],
            'comeback_breakdown' => [
                'comeback_wins' => rand(2, 7),
                'comeback_draws' => rand(1, 3),
                'total_comebacks' => rand(3, 9),
                'comeback_frequency' => round(rand(180, 320) / 1000, 3),
                'comeback_success_rate' => round(rand(650, 900) / 1000, 3)
            ],
            'comeback_by_deficit' => [
                'from_1goal' => rand(2, 6),
                'from_2goal' => rand(1, 4),
                'from_3plus_goal' => rand(0, 2),
                'max_deficit_overcome' => rand(2, 5)
            ],
            'blown_leads' => [
                'blown_lead_losses' => rand(1, 4),
                'blown_lead_draws' => rand(1, 3),
                'blown_lead_frequency' => round(rand(70, 140) / 1000, 3)
            ],
            'mental_strength' => [
                'avg_comeback_margin' => round(rand(120, 220) / 100, 2),
                'resilience_score' => round(($awayStrength - 0.3) + (rand(-100, 200) / 1000), 3)
            ]
        ],
        'h2h' => [
            'total_matches' => rand(6, 12),
            'home_team_comebacks' => rand(1, 4),
            'away_team_comebacks' => rand(1, 5),
            'comeback_advantage' => round(rand(-200, 200) / 1000, 3),
            'avg_intensity' => round(rand(200, 350) / 100, 2)
        ]
    ];
}

function calculateLegendModeInsights($data) {
    $homeFreq = $data['home']['comeback_breakdown']['comeback_frequency'];
    $awayFreq = $data['away']['comeback_breakdown']['comeback_frequency'];
    
    $homeResilience = $data['home']['mental_strength']['resilience_score'];
    $awayResilience = $data['away']['mental_strength']['resilience_score'];
    
    return [
        'comeback_kings' => $homeFreq > $awayFreq ? 'home' : 'away',
        'mental_toughness_winner' => $homeResilience > $awayResilience ? 'home' : 'away',
        'prediction_weight' => [
            'comeback_factor_importance' => 0.25,
            'mental_strength_bonus' => 0.15,
            'h2h_comeback_history' => 0.10
        ],
        'legend_score' => [
            'home' => round(($homeFreq * 0.4 + $homeResilience * 0.6) * 100, 1),
            'away' => round(($awayFreq * 0.4 + $awayResilience * 0.6) * 100, 1)
        ]
    ];
}

function getTeamStrength($teamName) {
    $strengths = [
        'Barcelona' => 0.75, 'Real Madrid' => 0.78, 'Madrid Fehér' => 0.78,
        'Madrid Piros' => 0.65, 'Valencia' => 0.68, 'Sevilla' => 0.70,
        'Bilbao' => 0.62, 'Villarreal' => 0.66, 'Las Palmas' => 0.55,
        'Getafe' => 0.58, 'Girona' => 0.60, 'Alaves' => 0.52,
        'Mallorca' => 0.56, 'Osasuna' => 0.54, 'San Sebastian' => 0.64,
        'Vigo' => 0.53
    ];
    
    return $strengths[$teamName] ?? 0.60;
}
?>
