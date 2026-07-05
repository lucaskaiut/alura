<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttributeValueController extends Controller
{
    public function index(Request $request, $attribute): JsonResponse
    {
        $attributeId = (int) $attribute;

        $values = AttributeValue::where('attribute_id', $attributeId)
            ->paginate(50);

        return response()->json($values);
    }

    public function store(Request $request, $attribute): JsonResponse
    {
        $attributeId = (int) $attribute;

        $validated = $request->validate([
            'value' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
        ]);

        $slug = $validated['slug'] ?? \Illuminate\Support\Str::slug($validated['value']);

        $attributeValue = AttributeValue::create([
            'attribute_id' => $attributeId,
            'value' => $validated['value'],
            'slug' => $slug,
        ]);

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
