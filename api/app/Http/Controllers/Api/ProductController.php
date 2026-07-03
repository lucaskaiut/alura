<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->productService->list($request));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create($request->validated(), $request->user()?->id);

        return response()->json($product, 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['brand', 'category', 'categories', 'variants', 'media', 'stock']));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product = $this->productService->update($product, $request->validated(), $request->user()?->id);

        return response()->json($product);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->productService->delete($product, request()->user()?->id);

        return response()->json(null, 204);
    }

    public function storeIndex(Request $request): JsonResponse
    {
        return response()->json($this->productService->storeIndex($request));
    }

    public function storeShow(Product $product): JsonResponse
    {
        return response()->json($product->load(['brand', 'category', 'variants', 'media', 'stock']));
    }

    public function suggestions(Request $request): JsonResponse
    {
        return response()->json($this->productService->suggestions($request->input('q', '')));
    }
}
