<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttributeController extends Controller
{
    public function index(): JsonResponse
    {
        $attributes = Attribute::with('values')->paginate(20);

        return response()->json($attributes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'is_filterable' => 'boolean',
            'is_variation' => 'boolean',
            'position' => 'nullable|integer',
            'status' => 'nullable|boolean',
        ]);

        $attribute = Attribute::create($validated);

        return response()->json($attribute, 201);
    }

    public function show(Attribute $attribute): JsonResponse
    {
        $attribute->load('values');

        return response()->json($attribute);
    }

    public function update(Request $request, Attribute $attribute): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:50',
            'is_filterable' => 'boolean',
            'is_variation' => 'boolean',
            'position' => 'nullable|integer',
            'status' => 'sometimes|boolean',
        ]);

        $attribute->update($validated);

        return response()->json($attribute);
    }

    public function destroy(Attribute $attribute): JsonResponse
    {
        $attribute->delete();

        return response()->json(null, 204);
    }
}
