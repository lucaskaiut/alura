<?php

namespace App\Core\Router\Resolvers;

use App\Core\Router\Contracts\RouterResolver;
use App\Core\Router\DTOs\RouteMatch;
use App\Models\Category;

class CategoryResolver implements RouterResolver
{
    public function name(): string
    {
        return 'category';
    }

    public function priority(): int
    {
        return 20;
    }

    public function resolve(string $path): ?RouteMatch
    {
        $path = ltrim($path, '/');

        if (empty($path)) {
            return null;
        }

        $segments = explode('/', $path);
        $lastSlug = array_pop($segments);

        if (empty($lastSlug)) {
            return null;
        }

        $category = Category::where('slug', $lastSlug)->where('status', true)->first();

        if ($category) {
            $category->load(['products' => fn ($q) => $q->where('status', true)->with('media')]);
            $breadcrumb = [];
            $current = $category;

            while ($current) {
                array_unshift($breadcrumb, [
                    'id' => $current->id,
                    'name' => $current->name,
                    'slug' => $current->slug,
                ]);
                $current = $current->parent;
            }

            return new RouteMatch(
                type: 'category',
                data: ['category' => $category->toArray(), 'breadcrumb' => $breadcrumb],
                seo: ['title' => $category->name ?? '', 'description' => $category->description ?? ''],
            );
        }

        return null;
    }
}
