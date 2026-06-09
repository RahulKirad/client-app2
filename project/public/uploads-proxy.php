<?php
declare(strict_types=1);

$configFile = __DIR__ . '/api-backend.config.php';
$config = is_readable($configFile) ? require $configFile : [];
$backendOrigin = rtrim((string) ($config['backend_origin'] ?? 'https://app.cottonunique.com'), '/');

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = ltrim(str_replace(['..', "\0"], '', $path), '/');

$query = $_GET;
unset($query['path']);
$queryString = http_build_query($query);
$targetUrl = $backendOrigin . '/uploads/' . $path . ($queryString !== '' ? '?' . $queryString : '');

$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
]);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Uploads backend unavailable',
        'detail' => curl_error($ch),
    ]);
    curl_close($ch);
    exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

http_response_code($status);

foreach (explode("\r\n", $rawHeaders) as $headerLine) {
    if ($headerLine === '' || stripos($headerLine, 'HTTP/') === 0) {
        continue;
    }
    $colon = strpos($headerLine, ':');
    if ($colon === false) {
        continue;
    }
    $headerName = strtolower(trim(substr($headerLine, 0, $colon)));
    if (in_array($headerName, ['transfer-encoding', 'content-encoding', 'content-length'], true)) {
        continue;
    }
    header($headerLine);
}

echo $responseBody;
