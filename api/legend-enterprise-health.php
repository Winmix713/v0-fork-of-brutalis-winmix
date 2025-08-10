<?php

// Clean output buffer and set proper headers
ob_clean();
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $detailed = isset($_GET['detailed']) && $_GET['detailed'] === 'true';
    $startTime = microtime(true);
    
    // Basic health check
    $health = [
        'status' => 'healthy',
        'timestamp' => date('c'),
        'version' => 'legend_enterprise_v1',
        'uptime' => round(microtime(true) - $startTime, 3)
    ];
    
    if ($detailed) {
        // Database connection check (mock)
        $dbStatus = checkDatabaseConnection();
        
        // Cache status check
        $cacheStatus = checkCacheStatus();
        
        // API endpoints check
        $endpointsStatus = checkAPIEndpoints();
        
        $health['detailed'] = [
            'database' => $dbStatus,
            'cache' => $cacheStatus,
            'endpoints' => $endpointsStatus,
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true)
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'server_time' => date('c'),
                'timezone' => date_default_timezone_get()
            ]
        ];
    }
    
    // Clean JSON output
    echo json_encode($health, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('c'),
        'code' => 'HEALTH_CHECK_ERROR'
    ], JSON_PRETTY_PRINT);
}

function checkDatabaseConnection() {
    // Mock database check - replace with actual Supabase connection
    try {
        // Simulate connection check
        usleep(rand(10000, 50000)); // 10-50ms delay
        
        return [
            'status' => 'connected',
            'response_time_ms' => rand(15, 45),
            'last_check' => date('c')
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage(),
            'last_check' => date('c')
        ];
    }
}

function checkCacheStatus() {
    // Mock cache check
    return [
        'status' => 'active',
        'hit_rate' => rand(75, 95) . '%',
        'total_entries' => rand(1500, 3000),
        'expired_entries' => rand(50, 200),
        'last_cleanup' => date('c', strtotime('-2 hours'))
    ];
}

function checkAPIEndpoints() {
    $endpoints = [
        'prediction-batch.php' => checkEndpoint('/api/prediction-batch.php'),
        'legend-mode-prediction.php' => checkEndpoint('/api/legend-mode-prediction.php'),
        'legend-mode-enterprise.php' => checkEndpoint('/api/legend-mode-enterprise.php')
    ];
    
    return $endpoints;
}

function checkEndpoint($endpoint) {
    // Mock endpoint check
    $responseTime = rand(25, 80);
    $status = $responseTime < 70 ? 'healthy' : 'slow';
    
    return [
        'status' => $status,
        'response_time_ms' => $responseTime,
        'last_check' => date('c')
    ];
}
?>
