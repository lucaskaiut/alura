<?php

namespace App\Core\Payment\DTOs;

readonly class PaymentResponse
{
    public function __construct(
        public bool $success,
        public string $status,
        public string $transactionId,
        public ?string $qrCode = null,
        public ?string $boletoUrl = null,
        public ?string $redirectUrl = null,
        public array $metadata = [],
        public ?string $message = null,
    ) {}
}
