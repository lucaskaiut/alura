<?php

namespace App\Core\Shipping\DTOs;

readonly class ShippingRequest
{
    public function __construct(
        public string $cep,
        public array $items = [],
        public ?float $total = null,
        public ?string $gateway = null,
    ) {}
}
