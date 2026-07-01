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
            'qr_code' => 'https://www.avasam.com/wp-content/uploads/2019/10/qr-sample.png',
            'pix_code' => '00020126580014br.gov.bcb.pix0136' . uniqid() . '5204000053039865405' . number_format((float) ($data['amount'] ?? 0), 2, '.', '') . '5802BR5925Njord Ecommerce6009SAO PAULO62070503***6304' . strtoupper(substr(md5(uniqid()), 0, 4)),
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
