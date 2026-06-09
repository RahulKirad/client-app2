<?php
/**
 * Backend origin for api-proxy.php and uploads-proxy.php (no trailing slash).
 *
 * Primary: public Node URL (app.cottonunique.com).
 * Fallback: internal URL on the same Hostinger VPS (from hPanel → Node.js → your app → Port).
 *   Example: 'http://127.0.0.1:43221'
 *   Use this when app.cottonunique.com returns 408 but Node is running locally.
 */
return [
    'backend_origin' => 'https://app.cottonunique.com',
    'backend_fallback_origin' => '',
];
