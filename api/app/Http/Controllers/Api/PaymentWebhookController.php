<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handle(string $gateway, Request $request, PaymentSyncService $syncService): JsonResponse
    {
        Log::info("PaymentWebhook: received for gateway '{$gateway}'", $request->all());

        $transactionId = $request->input('transaction_id')
            ?? $request->input('id')
            ?? $request->input('payment_id');

        if (! $transactionId) {
            return response()->json(['message' => 'transaction_id not found in payload'], 400);
        }

        $newStatus = $request->input('status')
            ?? $request->input('state')
            ?? $request->input('payment_status');

        if (! $newStatus) {
            return response()->json(['message' => 'status not found in payload'], 400);
        }

        // Normalize status to our internal values
        $newStatus = strtolower($newStatus);
        $validStatuses = ['pending', 'paid', 'failed', 'refunded', 'authorized', 'cancelled'];
        if (! in_array($newStatus, $validStatuses)) {
            return response()->json(['message' => "Unknown status '{$newStatus}'"], 400);
        }

        // Map gateway-specific statuses to our internal ones
        if ($newStatus === 'authorized') $newStatus = 'paid';
        if ($newStatus === 'cancelled') $newStatus = 'failed';

        $payment = Payment::where('transaction_id', $transactionId)
            ->where('gateway', $gateway)
            ->first();

        if (! $payment) {
            Log::warning("PaymentWebhook: payment not found for tx '{$transactionId}' gateway '{$gateway}'");
            return response()->json(['message' => 'Payment not found'], 404);
        }

        if ($payment->status === $newStatus) {
            return response()->json(['message' => 'Status unchanged']);
        }

        $payment->update([
            'status' => $newStatus,
            'paid_at' => $newStatus === 'paid' ? now() : $payment->paid_at,
        ]);

        // Sync order status
        $payment->load('order');
        if ($payment->order) {
            $syncService->syncOrderStatus($payment->order);
        }

        Log::info("PaymentWebhook: payment #{$payment->id} updated to '{$newStatus}'");

        return response()->json(['message' => 'OK']);
    }
}
