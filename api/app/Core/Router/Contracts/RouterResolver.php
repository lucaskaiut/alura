<?php

namespace App\Core\Router\Contracts;

use App\Core\Router\DTOs\RouteMatch;

interface RouterResolver
{
    public function resolve(string $path): ?RouteMatch;

    public function name(): string;

    public function priority(): int;
}
