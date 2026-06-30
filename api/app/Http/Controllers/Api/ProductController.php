<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\AuditService;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(
        private MediaService $mediaService,
        private AuditService $auditService,
    ) {}

    public function index(Request $request): JsonResponse
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

        $products = $query->latest()->paginate($request->input('per_page', 20));

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = tenant_id();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug,NULL,id,tenant_id,' . $tenantId,
            'short_desc' => 'nullable|string',
            'full_desc' => 'nullable|string',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
            'is_variable' => 'boolean',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'length' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'cost_price' => 'nullable|numeric',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'variants' => 'array',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.barcode' => 'nullable|string|max:100',
            'variants.*.price' => 'nullable|numeric',
            'variants.*.weight' => 'nullable|numeric',
            'variants.*.height' => 'nullable|numeric',
            'variants.*.width' => 'nullable|numeric',
            'variants.*.length' => 'nullable|numeric',
            'variants.*.rank' => 'integer',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'integer|exists:medias,id',
        ]);

        $product = Product::create($validated);

        if ($request->has('categories')) {
            $product->categories()->sync($request->input('categories'));
        }

        if ($request->has('variants') && $product->is_variable) {
            foreach ($request->input('variants') as $variantData) {
                $product->variants()->create($variantData);
            }
        }

        // Attach existing media from library
        if ($request->has('media_ids')) {
            foreach ($request->input('media_ids') as $i => $mediaId) {
                $product->attachMedia($mediaId, 'images', [
                    'rank' => $i,
                    'is_primary' => $i === 0,
                ]);
            }
        }

        $this->auditService->log("Product created by user {$request->user()?->id}: {$product->name}", [
            'user_id' => $request->user()?->id,
            'product_id' => $product->id,
        ]);

        return response()->json($product->load(['category', 'categories', 'variants', 'media']), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['brand', 'category', 'categories', 'variants', 'media', 'stock']));
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $tenantId = tenant_id();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:products,slug,' . $product->id . ',id,tenant_id,' . $tenantId,
            'short_desc' => 'nullable|string',
            'full_desc' => 'nullable|string',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'brand_id' => 'nullable|exists:brands,id',
            'category_id' => 'nullable|exists:categories,id',
            'is_variable' => 'boolean',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'length' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'cost_price' => 'nullable|numeric',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'integer|exists:medias,id',
            'removed_media_ids' => 'nullable|array',
            'removed_media_ids.*' => 'integer',
            'primary_media_id' => 'nullable|integer',
        ]);

        $product->update($validated);

        if ($request->has('categories')) {
            $product->categories()->sync($request->input('categories'));
        }

        // Remove media references
        if ($request->has('removed_media_ids')) {
            foreach ($request->input('removed_media_ids') as $mediaId) {
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

        // Attach existing media from library
        if ($request->has('media_ids')) {
            foreach ($request->input('media_ids') as $i => $mediaId) {
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

        // Set primary media
        if ($request->has('primary_media_id')) {
            $product->mediaReferences()
                ->where('collection', 'images')
                ->update(['is_primary' => false]);

            $product->mediaReferences()
                ->where('media_id', $request->input('primary_media_id'))
                ->where('collection', 'images')
                ->update(['is_primary' => true]);
        }

        $this->auditService->log("Product updated by user {$request->user()?->id}: {$product->name}", [
            'user_id' => $request->user()?->id,
            'product_id' => $product->id,
        ]);

        return response()->json($product->load(['brand', 'category', 'categories', 'variants', 'media']));
    }

    public function destroy(Product $product): JsonResponse
    {
        foreach ($product->mediaReferences as $ref) {
            $media = $ref->media;
            $ref->delete();
            $this->mediaService->deleteIfOrphan($media);
        }

        $product->delete();

        $this->auditService->log("Product deleted by user " . request()->user()?->id . ": {$product->name}", [
            'user_id' => request()->user()?->id,
            'product_id' => $product->id,
        ]);

        return response()->json(null, 204);
    }

    /** Public store: list products */
    public function storeIndex(Request $request): JsonResponse
    {
        $query = Product::where('status', true)->with('media');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $products = $query->latest()->paginate($request->input('per_page', 20));

        return response()->json($products);
    }

    /** Public store: product detail by slug */
    public function storeShow(Product $product): JsonResponse
    {
        return response()->json($product->load(['brand', 'category', 'variants', 'media', 'stock']));
    }
}
