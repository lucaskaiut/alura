<?php

namespace App\Gateways\Payment;

use App\Core\Payment\Contracts\PaymentGateway;

class PixGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'pix';
    }

    public function supportedMethods(): array
    {
        return ['pix'];
    }

    public function charge(array $data): array
    {
        return [
            'success' => true,
            'status' => 'pending',
            'transaction_id' => 'pix_' . uniqid(),
            'qr_code' => 'https://pix.example.com/qr/' . uniqid(),
        ];
    }

    public function refund(string $transactionId, float $amount): array
    {
        return [
            'success' => true,
            'status' => 'refunded',
            'transaction_id' => 'refund_' . uniqid(),
            'message' => 'Refund processed via Pix.',
        ];
    }

    public function getStatus(string $transactionId): array
    {
        return [
            'status' => 'paid',
            'transaction_id' => $transactionId,
        ];
    }
}
