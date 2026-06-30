<?php

namespace App\Core\Router;

use App\Core\Router\Contracts\RouterResolver;
use App\Core\Router\DTOs\RouteMatch;

class RouterService
{
    protected array $resolvers = [];

    public function register(RouterResolver $resolver): void
    {
        $this->resolvers[] = $resolver;

        usort($this->resolvers, fn (RouterResolver $a, RouterResolver $b) => $b->priority() <=> $a->priority());
    }

    public function resolve(string $path): RouteMatch
    {
        foreach ($this->resolvers as $resolver) {
            $match = $resolver->resolve($path);

            if ($match !== null) {
                return $match;
            }
        }

        return new RouteMatch(
            type: 'not_found',
            data: ['path' => $path],
            status: 404,
        );
    }
}
