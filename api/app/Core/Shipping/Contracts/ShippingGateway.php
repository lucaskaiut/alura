<?php

namespace App\Core\Shipping\Contracts;

interface ShippingGateway
{
    public function calculate(array $data): array;

    public function generateLabel(string $serviceCode, array $data): array;

    public function cancelLabel(string $labelId): void;

    public function name(): string;

    public function services(): array;
}
