<?php
/**
 * Backend origin for api-proxy.php and uploads-proxy.php (no trailing slash).
 * Cottonunique API is deployed at app.cottonunique.com (not on the static site's localhost).
 * Only use http://127.0.0.1:PORT if Node runs on the same server as this PHP file.
 */
return [
    'backend_origin' => 'https://app.cottonunique.com',
];
