<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingRuleController extends Controller
{
    public function index(): JsonResponse
    {
        $rules = ShippingRule::paginate(20);

        return response()->json($rules);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'gateway' => 'required|string|max:255',
            'service_code' => 'nullable|string|max:255',
            'free_from' => 'nullable|numeric|min:0',
            'min_value' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'zip_ranges' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $rule = ShippingRule::create($validated);

        return response()->json($rule, 201);
    }

    public function show(ShippingRule $shippingRule): JsonResponse
    {
        return response()->json($shippingRule);
    }

    public function update(Request $request, ShippingRule $shippingRule): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'gateway' => 'sometimes|string|max:255',
            'service_code' => 'nullable|string|max:255',
            'free_from' => 'nullable|numeric|min:0',
            'min_value' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'zip_ranges' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $shippingRule->update($validated);

        return response()->json($shippingRule);
    }

    public function destroy(ShippingRule $shippingRule): JsonResponse
    {
        $shippingRule->delete();

        return response()->json(null, 204);
    }
}
