<?php

namespace App\Gateways\Shipping;

use App\Core\Shipping\Contracts\ShippingGateway;
use App\Models\ShippingRule;

class FixedShippingGateway implements ShippingGateway
{
    public function name(): string
    {
        return 'fixed_shipping';
    }

    public function services(): array
    {
        return [
            ['code' => 'fixed_standard', 'name' => 'Frete Fixo'],
            ['code' => 'fixed_express', 'name' => 'Frete Expresso'],
        ];
    }

    public function calculate(array $data): array
    {
        $total = (float) ($data['total'] ?? 0);
        $cep = $data['cep'] ?? '';

        $rules = ShippingRule::where('gateway', $this->name())
            ->where('status', true)
            ->get();

        $results = [];

        foreach ($rules as $rule) {
            if ($rule->free_from !== null && $total >= (float) $rule->free_from) {
                $results[] = [
                    'gateway' => $this->name(),
                    'service_code' => $rule->service_code ?? 'fixed_standard',
                    'name' => $rule->name,
                    'price' => 0,
                    'delivery_days' => 7,
                    'meta' => ['free_shipping' => true],
                ];
                continue;
            }

            if ($rule->min_value !== null) {
                $results[] = [
                    'gateway' => $this->name(),
                    'service_code' => $rule->service_code ?? 'fixed_standard',
                    'name' => $rule->name,
                    'price' => (float) $rule->min_value,
                    'delivery_days' => 7,
                    'meta' => [],
                ];
            }
        }

        if (empty($results)) {
            $results[] = [
                'gateway' => $this->name(),
                'service_code' => 'fixed_standard',
                'name' => 'Frete Fixo',
                'price' => 20.00,
                'delivery_days' => 7,
                'meta' => [],
            ];
        }

        return $results;
    }

    public function generateLabel(string $serviceCode, array $data): array
    {
        return [
            'success' => true,
            'label_id' => 'fixed_' . uniqid(),
            'tracking_code' => null,
            'label_url' => null,
        ];
    }

    public function cancelLabel(string $labelId): void
    {
        // Simulated cancellation
    }
}
