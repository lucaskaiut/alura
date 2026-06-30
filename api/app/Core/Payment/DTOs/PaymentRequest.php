<?php

namespace App\Core\Payment\DTOs;

readonly class PaymentRequest
{
    public function __construct(
        public string $gateway,
        public string $method,
        public float $amount,
        public int $orderId,
        public array $customer = [],
        public array $metadata = [],
    ) {}
}
