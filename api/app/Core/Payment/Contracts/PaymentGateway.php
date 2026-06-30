<?php

namespace App\Core\Payment\Contracts;

interface PaymentGateway
{
    public function charge(array $data): array;

    public function refund(string $transactionId, float $amount): array;

    public function getStatus(string $transactionId): array;

    public function name(): string;

    public function supportedMethods(): array;
}
