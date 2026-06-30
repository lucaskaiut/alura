<?php

namespace App\Gateways\Payment;

use App\Core\Payment\Contracts\PaymentGateway;

class BoletoGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'boleto';
    }

    public function supportedMethods(): array
    {
        return ['boleto'];
    }

    public function charge(array $data): array
    {
        return [
            'success' => true,
            'status' => 'pending',
            'transaction_id' => 'boleto_' . uniqid(),
            'boleto_url' => 'https://boleto.example.com/' . uniqid(),
        ];
    }

    public function refund(string $transactionId, float $amount): array
    {
        return [
            'success' => true,
            'status' => 'refunded',
            'transaction_id' => 'refund_' . uniqid(),
            'message' => 'Refund processed via boleto.',
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
