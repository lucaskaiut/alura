<?php

namespace App\Services;

use App\Events\ProductChanged;
use App\Models\Media;
use App\Models\Product;
use App\Services\OpenSearch\ProductSearchService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    public function __construct(
        private MediaService $mediaService,
        private AuditService $auditService,
        private ProductSearchService $searchService,
    ) {}

    public function list(Request $request): LengthAwarePaginator
    {
        $query = Product::with(['category', 'variants', 'media']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->input('brand_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->boolean('status'));
        }

        if ($request->filled('is_variable')) {
            $query->where('is_variable', $request->boolean('is_variable'));
        }

        return $query->latest()->paginate($request->input('per_page', 20));
    }

    public function create(array $data, ?int $userId): Product
    {
        $product = Product::create($data);

        if (!empty($data['categories'])) {
            $product->categories()->sync($data['categories']);
        }

        if (!empty($data['variants']) && $product->is_variable) {
            foreach ($data['variants'] as $variantData) {
                $product->variants()->create($variantData);
            }
        }

        if (!empty($data['media_ids'])) {
            foreach ($data['media_ids'] as $i => $mediaId) {
                $product->attachMedia($mediaId, 'images', [
                    'rank' => $i,
                    'is_primary' => $i === 0,
                ]);
            }
        }

        $this->auditService->log("Product created by user {$userId}: {$product->name}", [
            'user_id' => $userId,
            'product_id' => $product->id,
        ]);

        ProductChanged::dispatch($product, 'created');

        return $product->load(['category', 'categories', 'variants', 'media']);
    }

    public function update(Product $product, array $data, ?int $userId): Product
    {
        $product->update($data);

        if (array_key_exists('categories', $data)) {
            $product->categories()->sync($data['categories']);
        }

        if (!empty($data['removed_media_ids'])) {
            foreach ($data['removed_media_ids'] as $mediaId) {
                $ref = $product->mediaReferences()
                    ->where('media_id', $mediaId)
                    ->where('collection', 'images')
                    ->first();

                if ($ref) {
                    $ref->delete();
                    $this->mediaService->deleteIfOrphan(Media::find($mediaId));
                }
            }
        }

        if (!empty($data['media_ids'])) {
            foreach ($data['media_ids'] as $i => $mediaId) {
                $exists = $product->mediaReferences()
                    ->where('media_id', $mediaId)
                    ->where('collection', 'images')
                    ->exists();
                if (!$exists) {
                    $rank = $product->media()->wherePivot('collection', 'images')->count();
                    $product->attachMedia($mediaId, 'images', ['rank' => $rank]);
                }
            }
        }

        if (!empty($data['primary_media_id'])) {
            $product->mediaReferences()
                ->where('collection', 'images')
                ->update(['is_primary' => false]);

            $product->mediaReferences()
                ->where('media_id', $data['primary_media_id'])
                ->where('collection', 'images')
                ->update(['is_primary' => true]);
        }

        $this->auditService->log("Product updated by user {$userId}: {$product->name}", [
            'user_id' => $userId,
            'product_id' => $product->id,
        ]);

        ProductChanged::dispatch($product, 'updated');

        return $product->load(['brand', 'category', 'categories', 'variants', 'media']);
    }

    public function delete(Product $product, ?int $userId): void
    {
        foreach ($product->mediaReferences as $ref) {
            $media = $ref->media;
            $ref->delete();
            $this->mediaService->deleteIfOrphan($media);
        }

        $product->delete();

        ProductChanged::dispatch($product, 'deleted');

        $this->auditService->log("Product deleted by user {$userId}: {$product->name}", [
            'user_id' => $userId,
            'product_id' => $product->id,
        ]);
    }

    public function storeIndex(Request $request): array
    {
        $hasSearch = $request->filled('search');
        $hasFilters = $request->filled('brand_id') || $request->filled('price_min')
            || $request->filled('price_max') || $request->filled('in_stock');

        if ($hasSearch || $hasFilters) {
            $result = $this->searchService->search([
                'search' => $request->input('search'),
                'page' => $request->input('page', 1),
                'per_page' => $request->input('per_page', 20),
                'category_id' => $request->input('category_id'),
                'brand_id' => $request->input('brand_id'),
                'price_min' => $request->input('price_min'),
                'price_max' => $request->input('price_max'),
                'in_stock' => $request->input('in_stock'),
                'sort' => $request->input('sort', 'relevance'),
            ]);

            $products = collect();
            if (!empty($result['ids'])) {
                $products = Product::whereIn('id', $result['ids'])
                    ->with('media')
                    ->get()
                    ->sortBy(fn($p) => array_search($p->id, $result['ids']));
            }

            return [
                'data' => $products->values(),
                'current_page' => $result['current_page'],
                'per_page' => $result['per_page'],
                'total' => $result['total'],
                'last_page' => $result['last_page'],
                'facets' => $result['facets'],
            ];
        }

        $query = Product::where('status', true)->with('media');

        if ($request->filled('ids')) {
            $ids = array_map('intval', explode(',', $request->input('ids')));
            $query->whereIn('id', $ids);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        return $query->latest()->paginate($request->input('per_page', 20))->toArray();
    }

    public function suggestions(string $query): array
    {
        if (blank($query)) {
            return [];
        }

        return $this->searchService->suggest($query);
    }
}
