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
        $statuses = OrderStatus::with('outgoingTransitions.toStatus')
            ->orderBy('id')
            ->get();

        return response()->json($statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'variant' => 'nullable|in:success,warning,danger,info,neutral',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded',
            'button_label' => 'nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            OrderStatus::where('is_default', true)->update(['is_default' => false]);
        }

        $status = OrderStatus::create($validated);

        return response()->json($status, 201);
    }

    public function show(OrderStatus $orderStatus): JsonResponse
    {
        $orderStatus->load('outgoingTransitions.toStatus');

        return response()->json($orderStatus);
    }

    public function update(Request $request, OrderStatus $orderStatus): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'color' => 'nullable|string|max:20',
            'variant' => 'nullable|in:success,warning,danger,info,neutral',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded',
            'button_label' => 'nullable|string|max:50',
            'is_default' => 'boolean',
        ]);

        if ($request->boolean('is_default')) {
            OrderStatus::where('is_default', true)->where('id', '!=', $orderStatus->id)->update(['is_default' => false]);
        }

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

    public function allTransitions(): JsonResponse
    {
        $transitions = OrderStatusTransition::with(['fromStatus', 'toStatus'])->get();

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
