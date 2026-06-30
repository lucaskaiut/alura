<?php

namespace App\Core\Router\Resolvers;

use App\Core\Router\Contracts\RouterResolver;
use App\Core\Router\DTOs\RouteMatch;

class DefaultResolver implements RouterResolver
{
    public function name(): string
    {
        return 'default';
    }

    public function priority(): int
    {
        return 0;
    }

    public function resolve(string $path): ?RouteMatch
    {
        return new RouteMatch(
            type: 'not_found',
            data: ['path' => trim($path, '/')],
            status: 404,
        );
    }
}
