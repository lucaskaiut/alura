<?php

namespace App\Http\Controllers\Api;

use App\Events\OrderStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::with(['items', 'status', 'payments', 'customer'])->paginate(20);

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load(['items', 'status', 'payments', 'transactions.user', 'customer']);

        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:order_statuses,id',
        ]);

        $oldStatusId = $order->status_id;

        $order->update(['status_id' => $validated['status_id']]);
        $order->load('customer');

        Log::info('OrderController: dispatching OrderStatusChanged', [
            'order_number' => $order->number,
            'old_status_id' => $oldStatusId,
            'new_status_id' => $validated['status_id'],
            'customer_id' => $order->customer_id,
            'customer_email' => $order->customer?->email,
        ]);

        $order->transactions()->create([
            'type' => 'status_change',
            'data' => [
                'from_status_id' => $oldStatusId,
                'to_status_id' => $validated['status_id'],
            ],
            'user_id' => auth()->id(),
        ]);

        event(new OrderStatusChanged($order, $oldStatusId));

        return response()->json($order->load('status'));
    }
}
