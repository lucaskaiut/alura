<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderStatus;
use App\Models\OrderStatusTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderStatusController extends Controller
{
    public function index(): JsonResponse
    {
        $statuses = OrderStatus::paginate(20);

        return response()->json($statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        $status = OrderStatus::create($validated);

        return response()->json($status, 201);
    }

    public function show(OrderStatus $orderStatus): JsonResponse
    {
        return response()->json($orderStatus);
    }

    public function update(Request $request, OrderStatus $orderStatus): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        $orderStatus->update($validated);

        return response()->json($orderStatus);
    }

    public function destroy(OrderStatus $orderStatus): JsonResponse
    {
        $orderStatus->delete();

        return response()->json(null, 204);
    }

    public function transitions(OrderStatus $orderStatus): JsonResponse
    {
        $transitions = OrderStatusTransition::where('from_status_id', $orderStatus->id)
            ->with('toStatus')
            ->get();

        return response()->json($transitions);
    }

    public function storeTransition(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_status_id' => 'required|exists:order_statuses,id',
            'to_status_id' => 'required|exists:order_statuses,id|different:from_status_id',
        ]);

        $transition = OrderStatusTransition::create($validated);

        return response()->json($transition, 201);
    }

    public function destroyTransition(OrderStatusTransition $transition): JsonResponse
    {
        $transition->delete();

        return response()->json(null, 204);
    }
}
