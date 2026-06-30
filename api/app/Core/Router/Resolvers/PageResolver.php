<?php

namespace App\Core\Router\Resolvers;

use App\Core\Router\Contracts\RouterResolver;
use App\Core\Router\DTOs\RouteMatch;
use App\Models\Page;
use App\Models\Product;

class PageResolver implements RouterResolver
{
    public function name(): string
    {
        return 'page';
    }

    public function priority(): int
    {
        return 30;
    }

    public function resolve(string $path): ?RouteMatch
    {
        $path = ltrim($path, '/');

        // Home page
        if (empty($path)) {
            $home = Page::where('is_home', true)->where('status', true)->first();
            if ($home) {
                return new RouteMatch(
                    type: 'home',
                    data: ['page' => $home->toArray()],
                    seo: [
                        'title' => $home->meta_title ?? $home->title,
                        'description' => $home->meta_description ?? '',
                    ],
                );
            }

            // Fallback: show recent products as home
            $products = Product::where('status', true)->with('media')->latest()->take(12)->get();
            return new RouteMatch(
                type: 'home',
                data: ['featured_products' => $products->toArray(), 'title' => tenant()?->name ?? 'Loja'],
                seo: ['title' => tenant()?->name ?? 'Loja'],
            );
        }

        $page = Page::where('slug', $path)->where('status', true)->first();

        if ($page && !$page->is_home) {
            return new RouteMatch(
                type: 'page',
                data: ['page' => $page->toArray()],
                seo: [
                    'title' => $page->meta_title ?? $page->title,
                    'description' => $page->meta_description ?? '',
                ],
            );
        }

        return null;
    }
}
