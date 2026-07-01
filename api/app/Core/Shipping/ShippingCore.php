<?php

namespace App\Core\Shipping;

use App\Core\Shipping\Contracts\ShippingGateway;
use App\Core\Shipping\DTOs\ShippingOption;
use App\Core\Shipping\DTOs\ShippingRequest;

class ShippingCore
{
    protected array $gateways = [];

    public function register(ShippingGateway $gateway): void
    {
        $this->gateways[$gateway->name()] = $gateway;
    }

    /** @return ShippingOption[] */
    public function calculate(string $gatewayName, ShippingRequest $request): array
    {
        $gateway = $this->gateways[$gatewayName] ?? null;

        if (! $gateway) {
            return [];
        }

        return $gateway->calculate($request);
    }

    /** @return ShippingOption[] */
    public function calculateAll(ShippingRequest $request): array
    {
        $results = [];

        foreach ($this->gateways as $gateway) {
            foreach ($gateway->calculate($request) as $option) {
                $results[] = $option;
            }
        }

        return $results;
    }

    public function getGatewayNames(): array
    {
        return array_keys($this->gateways);
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
