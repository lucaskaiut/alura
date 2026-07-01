<?php

namespace App\Core\Shipping\Contracts;

use App\Core\Shipping\DTOs\ShippingOption;
use App\Core\Shipping\DTOs\ShippingRequest;

interface ShippingGateway
{
    /** @return ShippingOption[] */
    public function calculate(ShippingRequest $request): array;

    public function generateLabel(string $serviceCode, array $data): array;

    public function cancelLabel(string $labelId): void;

    public function name(): string;
}
