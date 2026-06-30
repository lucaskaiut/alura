<?php

namespace App\Core\Router\DTOs;

readonly class RouteMatch
{
    public function __construct(
        public string $type,
        public array $data,
        public array $seo = [],
        public int $status = 200,
        public array $meta = [],
    ) {}
}
