<?php

namespace App\Core\Router\Resolvers;

use App\Core\Router\Contracts\RouterResolver;
use App\Core\Router\DTOs\RouteMatch;
use App\Models\Product;

class ProductResolver implements RouterResolver
{
    public function name(): string
    {
        return 'product';
    }

    public function priority(): int
    {
        return 10;
    }

    public function resolve(string $path): ?RouteMatch
    {
        $slug = ltrim($path, '/');

        if (empty($slug)) return null;

        $product = Product::where('slug', $slug)->where('status', true)
            ->with(['media', 'variants.attributeValues.attribute', 'variants.media'])
            ->first();

        if ($product) {
            return new RouteMatch(
                type: 'product',
                data: ['product' => $product->toArray()],
                seo: [
                    'title' => $product->meta_title ?? $product->name,
                    'description' => $product->meta_description ?? $product->short_desc ?? '',
                ],
            );
        }

        return null;
    }
}
