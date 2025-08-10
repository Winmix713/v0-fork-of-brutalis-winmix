<?php

// Clean output buffer to prevent JSON parsing errors
ob_clean();
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Suppress PHP warnings that could break JSON
error_reporting(E_ERROR | E_PARSE);

// Function to handle JSON encoding errors
function safe_json_encode($value) {
    $encoded = json_encode($value);
    if ($encoded === false) {
        // Handle JSON encoding error
        $error = json_last_error_msg();
        return json_encode(["error" => "JSON encoding failed: " . $error]);
    }
    return $encoded;
}

// Example data to be returned as JSON
$data = [
    "status" => "success",
    "message" => "Legend mode prediction data",
    "data" => [
        "prediction" => "example prediction",
        "confidence" => 0.95
    ]
];

// Output the JSON response
echo safe_json_encode($data);

?>
