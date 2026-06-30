<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('children')->paginate(20);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = tenant_id();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,NULL,id,tenant_id,' . $tenantId,
            'description' => 'nullable|string',
            'image_path' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'status' => 'nullable|boolean',
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->load('children', 'parent');

        return response()->json($category);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $tenantId = tenant_id();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $category->id . ',id,tenant_id,' . $tenantId,
            'description' => 'nullable|string',
            'image_path' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'status' => 'sometimes|boolean',
        ]);

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(null, 204);
    }
}
