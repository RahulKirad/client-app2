<?php
declare(strict_types=1);

@set_time_limit(120);
@ignore_user_abort(true);

$configFile = __DIR__ . '/api-backend.config.php';
$config = is_readable($configFile) ? require $configFile : [];

$origins = [];
foreach (['backend_origin', 'backend_fallback_origin'] as $key) {
    $origin = rtrim((string) ($config[$key] ?? ''), '/');
    if ($origin !== '' && !in_array($origin, $origins, true)) {
        $origins[] = $origin;
    }
}
if ($origins === []) {
    $origins[] = 'https://app.cottonunique.com';
}

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
$path = ltrim(str_replace("\0", '', $path), '/');

$query = $_GET;
unset($query['path']);
$queryString = http_build_query($query);

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

$requestBody = null;
$mime = null;
$usePostMultipart = $isMultipart && $method === 'POST' && (!empty($_FILES) || !empty($_POST));

if ($usePostMultipart) {
    // Handled per-request inside the loop (curl handle needed for mime).
} elseif ($isMultipart) {
    $requestBody = file_get_contents('php://input');
    if ($contentType !== '') {
        $forwardHeaders[] = 'Content-Type: ' . $contentType;
    }
} elseif (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $requestBody = file_get_contents('php://input');
}

/**
 * @return array{ok: bool, status: int, headers: string, body: string, target: string, curlError: string}
 */
function proxyToBackend(
    string $backendOrigin,
    string $path,
    string $queryString,
    string $method,
    array $forwardHeaders,
    bool $isMultipart,
    bool $usePostMultipart,
    ?string $requestBody
): array {
    $targetUrl = $backendOrigin . '/api/' . $path . ($queryString !== '' ? '?' . $queryString : '');

    $ch = curl_init($targetUrl);
    $curlOpts = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $forwardHeaders,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 90,
        CURLOPT_TCP_KEEPALIVE => 1,
        CURLOPT_TCP_KEEPIDLE => 30,
        CURLOPT_TCP_KEEPINTVL => 15,
    ];

    $mime = null;

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
    } elseif ($requestBody !== null) {
        $curlOpts[CURLOPT_POSTFIELDS] = $requestBody;
    }

    curl_setopt_array($ch, $curlOpts);

    $response = curl_exec($ch);

    if ($mime !== null) {
        curl_mime_free($mime);
    }

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'ok' => false,
            'status' => 0,
            'headers' => '',
            'body' => '',
            'target' => $targetUrl,
            'curlError' => $error,
        ];
    }

    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    return [
        'ok' => true,
        'status' => $status,
        'headers' => substr($response, 0, $headerSize),
        'body' => substr($response, $headerSize),
        'target' => $targetUrl,
        'curlError' => '',
    ];
}

$lastFailure = ['target' => '', 'status' => 0, 'curlError' => ''];
$result = null;

foreach ($origins as $origin) {
    $attempt = proxyToBackend(
        $origin,
        $path,
        $queryString,
        $method,
        $forwardHeaders,
        $isMultipart,
        $usePostMultipart,
        $requestBody
    );

    if (!$attempt['ok']) {
        $lastFailure = [
            'target' => $attempt['target'],
            'status' => 0,
            'curlError' => $attempt['curlError'],
        ];
        continue;
    }

    // Hostinger CDN returns 408 instantly when the Node app is stopped.
    if (in_array($attempt['status'], [408, 502, 503, 504], true)) {
        $lastFailure = [
            'target' => $attempt['target'],
            'status' => $attempt['status'],
            'curlError' => '',
        ];
        continue;
    }

    $result = $attempt;
    break;
}

if ($result === null) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Backend unavailable',
        'detail' => $lastFailure['curlError'] !== ''
            ? $lastFailure['curlError']
            : 'Node API returned HTTP ' . ($lastFailure['status'] ?: 'error') . '. Restart the Node.js app in Hostinger hPanel (app.cottonunique.com).',
        'target' => $lastFailure['target'],
        'tried' => $origins,
    ]);
    exit;
}

http_response_code($result['status']);

foreach (explode("\r\n", $result['headers']) as $headerLine) {
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

echo $result['body'];
