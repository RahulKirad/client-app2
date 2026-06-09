<?php
declare(strict_types=1);

$configFile = __DIR__ . '/api-backend.config.php';
$config = is_readable($configFile) ? require $configFile : [];
$backendOrigin = rtrim((string) ($config['backend_origin'] ?? 'https://app.cottonunique.com'), '/');

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = ltrim(str_replace("\0", '', $path), '/');

$query = $_GET;
unset($query['path']);
$queryString = http_build_query($query);
$targetUrl = $backendOrigin . '/api/' . $path . ($queryString !== '' ? '?' . $queryString : '');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$contentType = (string) ($_SERVER['HTTP_CONTENT_TYPE'] ?? $_SERVER['CONTENT_TYPE'] ?? '');
$isMultipart = stripos($contentType, 'multipart/form-data') !== false;

$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
$forwardHeaders = [];

foreach ($incomingHeaders as $name => $value) {
    $lower = strtolower((string) $name);
    if (in_array($lower, ['host', 'connection', 'content-length', 'accept-encoding', 'origin', 'referer'], true)) {
        continue;
    }
    if ($isMultipart && $lower === 'content-type') {
        continue;
    }
    $forwardHeaders[] = $name . ': ' . $value;
}

$ch = curl_init($targetUrl);
$curlOpts = [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $forwardHeaders,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 120,
];

$mime = null;
$usePostMultipart = $isMultipart && $method === 'POST' && (!empty($_FILES) || !empty($_POST));

if ($usePostMultipart) {
    $mime = curl_mime_init($ch);

    foreach ($_POST as $name => $value) {
        if (is_array($value)) {
            foreach ($value as $i => $item) {
                $part = curl_mime_addpart($mime);
                curl_mime_name($part, $name . '[' . $i . ']');
                curl_mime_data($part, (string) $item);
            }
            continue;
        }
        $part = curl_mime_addpart($mime);
        curl_mime_name($part, (string) $name);
        curl_mime_data($part, (string) $value);
    }

    foreach ($_FILES as $fieldName => $file) {
        if (is_array($file['name'])) {
            $count = count($file['name']);
            for ($i = 0; $i < $count; $i++) {
                if (($file['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                    continue;
                }
                $part = curl_mime_addpart($mime);
                curl_mime_name($part, (string) $fieldName);
                curl_mime_filedata($part, $file['tmp_name'][$i]);
                curl_mime_filename($part, (string) $file['name'][$i]);
                $fileType = (string) ($file['type'][$i] ?? 'application/octet-stream');
                curl_mime_type($part, $fileType !== '' ? $fileType : 'application/octet-stream');
            }
            continue;
        }
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            continue;
        }
        $part = curl_mime_addpart($mime);
        curl_mime_name($part, (string) $fieldName);
        curl_mime_filedata($part, $file['tmp_name']);
        curl_mime_filename($part, (string) $file['name']);
        $fileType = (string) ($file['type'] ?? 'application/octet-stream');
        curl_mime_type($part, $fileType !== '' ? $fileType : 'application/octet-stream');
    }

    curl_setopt($ch, CURLOPT_MIMEPOST, $mime);
} elseif ($isMultipart) {
  // PUT/PATCH multipart (PHP does not populate $_FILES for non-POST) — forward raw body.
    if ($contentType !== '') {
        $forwardHeaders[] = 'Content-Type: ' . $contentType;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
    }
    $body = file_get_contents('php://input');
    $curlOpts[CURLOPT_POSTFIELDS] = $body !== false ? $body : '';
} elseif (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $body = file_get_contents('php://input');
    $curlOpts[CURLOPT_POSTFIELDS] = $body !== false ? $body : '';
}

curl_setopt_array($ch, $curlOpts);

$response = curl_exec($ch);

if ($mime !== null) {
    curl_mime_free($mime);
}

if ($response === false) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Backend unavailable',
        'detail' => curl_error($ch),
        'target' => $targetUrl,
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
    header($headerLine, $headerName === 'set-cookie' ? false : true);
}

echo $responseBody;
