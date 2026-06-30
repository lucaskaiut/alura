<?php

namespace App\Gateways\Payment;

use App\Core\Payment\Contracts\PaymentGateway;

class CreditCardGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'credit_card';
    }

    public function supportedMethods(): array
    {
        return ['credit_card'];
    }

    public function charge(array $data): array
    {
        return [
            'success' => true,
            'status' => 'paid',
            'transaction_id' => 'cc_' . uniqid(),
        ];
    }

    public function refund(string $transactionId, float $amount): array
    {
        return [
            'success' => true,
            'status' => 'refunded',
            'transaction_id' => 'refund_' . uniqid(),
            'message' => 'Refund processed via credit card.',
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
