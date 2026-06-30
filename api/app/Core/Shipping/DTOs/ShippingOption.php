<?php

namespace App\Core\Shipping\DTOs;

readonly class ShippingOption
{
    public function __construct(
        public string $gateway,
        public string $serviceCode,
        public string $name,
        public float $price,
        public ?int $deliveryDays = null,
        public array $meta = [],
    ) {}
}
