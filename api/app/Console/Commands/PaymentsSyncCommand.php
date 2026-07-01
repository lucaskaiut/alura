<?php

namespace App\Console\Commands;

use App\Core\Payment\PaymentCore;
use App\Models\Payment;
use App\Services\PaymentSyncService;
use Illuminate\Console\Command;

class PaymentsSyncCommand extends Command
{
    protected $signature = 'payments:sync';
    protected $description = 'Poll payment gateways for pending payments and sync order statuses';

    public function handle(PaymentCore $paymentCore, PaymentSyncService $syncService): int
    {
        $pendingPayments = Payment::with('order')
            ->where('status', 'pending')
            ->whereNotNull('transaction_id')
            ->get();

        if ($pendingPayments->isEmpty()) {
            $this->info('No pending payments to sync.');

            return self::SUCCESS;
        }

        $updated = 0;

        foreach ($pendingPayments as $payment) {
            $gatewayName = $payment->gateway;
            $transactionId = $payment->transaction_id;

            $this->line("Checking payment #{$payment->id} (gateway: {$gatewayName}, tx: {$transactionId})");

            try {
                $result = $paymentCore->getStatus($gatewayName, $transactionId);

                if (! ($result['success'] ?? false)) {
                    $this->warn("  Failed to get status: " . ($result['message'] ?? 'unknown error'));
                    continue;
                }

                $newStatus = $result['status'] ?? null;
                if (! $newStatus || $newStatus === $payment->status) {
                    $this->line("  Status unchanged: {$payment->status}");
                    continue;
                }

                $this->info("  Status changed: {$payment->status} → {$newStatus}");

                $payment->update([
                    'status' => $newStatus,
                    'paid_at' => $newStatus === 'paid' ? now() : $payment->paid_at,
                ]);

                if ($payment->order) {
                    $syncService->syncOrderStatus($payment->order);
                }

                $updated++;
            } catch (\Throwable $e) {
                $this->error("  Error: {$e->getMessage()}");
            }
        }

        $this->info("Sync complete. Updated {$updated} payments.");

        return self::SUCCESS;
    }
}
