<?php

return [
    'host' => env('OPENSEARCH_HOST', 'localhost'),
    'port' => env('OPENSEARCH_PORT', 9200),
    'username' => env('OPENSEARCH_USERNAME', ''),
    'password' => env('OPENSEARCH_PASSWORD', ''),
    'scheme' => env('OPENSEARCH_SCHEME', 'http'),
    'index' => env('OPENSEARCH_INDEX', 'products'),
];
