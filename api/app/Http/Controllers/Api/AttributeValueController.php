<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttributeValueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AttributeValue::query();

        if ($request->has('attribute_id')) {
            $query->where('attribute_id', $request->attribute_id);
        }

        $values = $query->paginate(50);

        return response()->json($values);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'attribute_id' => 'required|exists:attributes,id',
            'value' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
        ]);

        $attributeValue = AttributeValue::create($validated);

        return response()->json($attributeValue, 201);
    }

    public function update(Request $request, AttributeValue $attributeValue): JsonResponse
    {
        $validated = $request->validate([
            'attribute_id' => 'sometimes|exists:attributes,id',
            'value' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
        ]);

        $attributeValue->update($validated);

        return response()->json($attributeValue);
    }

    public function destroy(AttributeValue $attributeValue): JsonResponse
    {
        $attributeValue->delete();

        return response()->json(null, 204);
    }
}
