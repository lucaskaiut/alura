<?php

namespace App\Core\Shipping;

use App\Core\Shipping\Contracts\ShippingGateway;
use App\Core\Shipping\DTOs\ShippingOption;

class ShippingCore
{
    protected array $gateways = [];

    public function register(ShippingGateway $gateway): void
    {
        $this->gateways[$gateway->name()] = $gateway;
    }

    public function calculate(string $gatewayName, array $data): array
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if (! $gateway) {
            return [];
        }

        return $gateway->calculate($data);
    }

    public function calculateAll(array $data): array
    {
        $results = [];

        foreach ($this->gateways as $gateway) {
            $options = $gateway->calculate($data);

            foreach ($options as $option) {
                $results[] = new ShippingOption(
                    gateway: $option['gateway'] ?? $gateway->name(),
                    serviceCode: $option['service_code'] ?? '',
                    name: $option['name'] ?? '',
                    price: (float) ($option['price'] ?? 0),
                    deliveryDays: $option['delivery_days'] ?? null,
                    meta: $option['meta'] ?? [],
                );
            }
        }

        return $results;
    }

    public function generateLabel(string $gatewayName, string $serviceCode, array $data): array
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if (! $gateway) {
            return ['success' => false, 'message' => "Gateway '{$gatewayName}' not found"];
        }

        return $gateway->generateLabel($serviceCode, $data);
    }

    public function cancelLabel(string $gatewayName, string $labelId): void
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if ($gateway) {
            $gateway->cancelLabel($labelId);
        }
    }
}
