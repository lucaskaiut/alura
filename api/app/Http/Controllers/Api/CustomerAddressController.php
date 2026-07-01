<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAddressController extends Controller
{
    // ─── Admin: address management via /customers/{customer}/addresses ───

    public function index(Customer $customer): JsonResponse
    {
        return response()->json($customer->addresses);
    }

    public function store(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:shipping,billing',
            'street' => 'required|string|max:255',
            'number' => 'required|string|max:20',
            'complement' => 'nullable|string|max:255',
            'neighborhood' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:2',
            'zip_code' => 'required|string|max:10',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            $customer->addresses()->where('type', $validated['type'])->update(['is_default' => false]);
        }

        $address = $customer->addresses()->create($validated);

        return response()->json($address, 201);
    }

    public function show(Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            abort(404);
        }

        return response()->json($address);
    }

    public function update(Request $request, Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            abort(404);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:shipping,billing',
            'street' => 'sometimes|string|max:255',
            'number' => 'sometimes|string|max:20',
            'complement' => 'nullable|string|max:255',
            'neighborhood' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'state' => 'sometimes|string|max:2',
            'zip_code' => 'sometimes|string|max:10',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            $customer->addresses()
                ->where('type', $validated['type'] ?? $address->type)
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json($address);
    }

    public function destroy(Customer $customer, CustomerAddress $address): JsonResponse
    {
        if ($address->customer_id !== $customer->id) {
            abort(404);
        }

        $address->delete();

        return response()->json(null, 204);
    }

    // ─── Storefront: address management for authenticated customer ───

    public function myAddresses(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (!$customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json($customer->addresses()->orderBy('is_default', 'desc')->orderBy('updated_at', 'desc')->get());
    }

    public function myStore(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (!$customer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'type' => 'required|in:shipping,billing',
            'street' => 'required|string|max:255',
            'number' => 'required|string|max:20',
            'complement' => 'nullable|string|max:255',
            'neighborhood' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:2',
            'country' => 'nullable|string|max:2',
            'zip_code' => 'required|string|max:10',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            $customer->addresses()->where('type', $validated['type'])->update(['is_default' => false]);
        }

        $address = $customer->addresses()->create($validated);

        return response()->json($address, 201);
    }

    public function myUpdate(Request $request, CustomerAddress $address): JsonResponse
    {
        $customer = $request->user();
        if (!$customer || $address->customer_id !== $customer->id) {
            abort(404);
        }

        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'type' => 'sometimes|in:shipping,billing',
            'street' => 'sometimes|string|max:255',
            'number' => 'sometimes|string|max:20',
            'complement' => 'nullable|string|max:255',
            'neighborhood' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'state' => 'sometimes|string|max:2',
            'country' => 'nullable|string|max:2',
            'zip_code' => 'sometimes|string|max:10',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            $customer->addresses()
                ->where('type', $validated['type'] ?? $address->type)
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json($address);
    }

    public function myDestroy(CustomerAddress $address): JsonResponse
    {
        $customer = request()->user();
        if (!$customer || $address->customer_id !== $customer->id) {
            abort(404);
        }

        $address->delete();

        return response()->json(null, 204);
    }

    public function setDefault(CustomerAddress $address): JsonResponse
    {
        $customer = request()->user();
        if (!$customer || $address->customer_id !== $customer->id) {
            abort(404);
        }

        $customer->addresses()->where('type', $address->type)->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json($address);
    }
}
