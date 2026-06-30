<?php

namespace App\Gateways\Shipping;

use App\Core\Shipping\Contracts\ShippingGateway;

class CorreiosGateway implements ShippingGateway
{
    public function name(): string
    {
        return 'correios';
    }

    public function services(): array
    {
        return [
            ['code' => 'pac', 'name' => 'PAC'],
            ['code' => 'sedex', 'name' => 'SEDEX'],
            ['code' => 'sedex10', 'name' => 'SEDEX 10'],
        ];
    }

    public function calculate(array $data): array
    {
        $cep = $data['cep'] ?? '';
        $total = (float) ($data['total'] ?? 0);

        return [
            [
                'gateway' => $this->name(),
                'service_code' => 'pac',
                'name' => 'PAC',
                'price' => 15.90,
                'delivery_days' => 10,
                'meta' => [],
            ],
            [
                'gateway' => $this->name(),
                'service_code' => 'sedex',
                'name' => 'SEDEX',
                'price' => 25.90,
                'delivery_days' => 3,
                'meta' => [],
            ],
        ];
    }

    public function generateLabel(string $serviceCode, array $data): array
    {
        return [
            'success' => true,
            'label_id' => 'correios_' . uniqid(),
            'tracking_code' => 'BR' . rand(100000000, 999999999) . 'BR',
            'label_url' => 'https://correios.example.com/label/' . uniqid(),
        ];
    }

    public function cancelLabel(string $labelId): void
    {
        // Simulated cancellation
    }
}
