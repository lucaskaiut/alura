<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::with(['items', 'status', 'payments'])->paginate(20);

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['items', 'status', 'payments', 'transactions']);

        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:order_statuses,id',
        ]);

        $order->update(['status_id' => $validated['status_id']]);

        $order->transactions()->create([
            'type' => 'status_change',
            'data' => [
                'from_status_id' => $order->getOriginal('status_id'),
                'to_status_id' => $validated['status_id'],
            ],
            'user_id' => auth()->id(),
        ]);

        return response()->json($order->load('status'));
    }
}
