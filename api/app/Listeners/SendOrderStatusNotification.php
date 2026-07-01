<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Mail\OrderStatusUpdated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderStatusNotification
{
    public function handle(OrderStatusChanged $event): void
    {
        Log::info('SendOrderStatusNotification: listener triggered', [
            'order_number' => $event->order->number,
            'old_status_id' => $event->oldStatusId,
        ]);

        $order = $event->order;
        $order->loadMissing(['items', 'status', 'customer']);

        $customer = $order->customer;
        if (! $customer || ! $customer->email) {
            Log::info("SendOrderStatusNotification: order #{$order->number} has no customer email. Skipping.", [
                'customer_id' => $order->customer_id,
                'has_customer' => (bool) $customer,
            ]);
            return;
        }

        try {
            Mail::to($customer->email)->send(new OrderStatusUpdated($order));
            Log::info("SendOrderStatusNotification: email sent to {$customer->email} for order #{$order->number}");
        } catch (\Throwable $e) {
            Log::error("SendOrderStatusNotification: failed to send email", [
                'error' => $e->getMessage(),
                'order_number' => $order->number,
            ]);
        }
    }
}
