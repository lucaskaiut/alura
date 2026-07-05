<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\OrderStatusTransition;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class PaymentSyncService
{
    public function syncOrderStatus(Order $order): void
    {
        // Get the latest payment for this order
        $payment = $order->payments()->latest()->first();
        if (! $payment) {
            return;
        }

        // Find order status mapped to this payment status
        $targetStatus = OrderStatus::where('payment_status', $payment->status)->first();
        if (! $targetStatus) {
            Log::info("PaymentSync: no order_status mapped to payment_status '{$payment->status}'");
            return;
        }

        // Already at the correct status
        if ((int) $order->status_id === (int) $targetStatus->id) {
            return;
        }

        // Check if transition is allowed
        $transitionAllowed = true;
        if ($order->status_id) {
            $transitionAllowed = OrderStatusTransition::where('from_status_id', $order->status_id)
                ->where('to_status_id', $targetStatus->id)
                ->exists();
        }

        if (! $transitionAllowed) {
            Log::info("PaymentSync: transition from status_id={$order->status_id} to {$targetStatus->id} not allowed");
            return;
        }

        // Apply the status change
        $oldStatusId = $order->status_id;
        $order->update(['status_id' => $targetStatus->id]);

        // Restore stock if payment failed or was refunded
        $restoreStatuses = ['failed', 'refunded'];
        if (in_array($payment->status, $restoreStatuses)) {
            $this->restoreStock($order);
        }

        $order->transactions()->create([
            'type' => 'payment',
            'data' => [
                'payment_id' => $payment->id,
                'payment_status' => $payment->status,
                'from_status_id' => $oldStatusId,
                'to_status_id' => $targetStatus->id,
            ],
            'user_id' => null, // automated, not by a user
        ]);

        Log::info("PaymentSync: order #{$order->number} moved to status '{$targetStatus->name}' (payment {$payment->status})");

        event(new OrderStatusChanged($order, $oldStatusId));
    }

    public function syncByPayment(Payment $payment): void
    {
        $order = $payment->order;
        if (! $order) {
            return;
        }

        $this->syncOrderStatus($order);
    }

    private function restoreStock(Order $order): void
    {
        $order->load('items');

        foreach ($order->items as $item) {
            if ($item->variant_id) {
                \App\Models\ProductVariant::where('id', $item->variant_id)->increment('stock', $item->quantity);
            } elseif ($item->product_id) {
                \App\Models\Product::where('id', $item->product_id)->increment('stock', $item->quantity);
            }
        }

        Log::info("PaymentSync: stock restored for order #{$order->number}", [
            'order_id' => $order->id,
        ]);
    }
}
