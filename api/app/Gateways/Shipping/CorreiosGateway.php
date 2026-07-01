<?php

namespace App\Gateways\Shipping;

use App\Core\Shipping\Contracts\ShippingGateway;
use App\Core\Shipping\DTOs\ShippingOption;
use App\Core\Shipping\DTOs\ShippingRequest;
use App\Models\ShippingRule;

class CorreiosGateway implements ShippingGateway
{
    public function name(): string
    {
        return 'correios';
    }

    public function calculate(ShippingRequest $request): array
    {
        $totalWeight = collect($request->items)->sum(fn ($i) => (float) ($i['weight'] ?? 0) * ($i['quantity'] ?? 1));

        $rules = ShippingRule::where('gateway', $this->name())
            ->where('status', true)
            ->get()
            ->filter(fn (ShippingRule $rule) => $this->matchesWeight($rule, $totalWeight))
            ->filter(fn (ShippingRule $rule) => $this->matchesZipRange($rule, $request->cep));

        if ($rules->isNotEmpty()) {
            return $rules->map(fn (ShippingRule $rule) => new ShippingOption(
                gateway: $this->name(),
                serviceCode: $rule->service_code,
                name: $rule->name,
                price: $this->resolvePrice($rule, $request->total ?? 0),
                deliveryDays: null,
                meta: [
                    'free_from' => $rule->free_from,
                    'min_weight' => $rule->min_weight,
                    'max_weight' => $rule->max_weight,
                ],
            ))->all();
        }

        // Fallback padrão
        return [
            new ShippingOption(
                gateway: $this->name(),
                serviceCode: 'pac',
                name: 'PAC',
                price: 15.90,
                deliveryDays: 10,
            ),
            new ShippingOption(
                gateway: $this->name(),
                serviceCode: 'sedex',
                name: 'SEDEX',
                price: 25.90,
                deliveryDays: 3,
            ),
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

    private function resolvePrice(ShippingRule $rule, float $cartTotal): float
    {
        if ($rule->free_from !== null && $cartTotal >= (float) $rule->free_from) {
            return 0;
        }

        return (float) ($rule->min_value ?? 0);
    }

    private function matchesWeight(ShippingRule $rule, float $totalWeight): bool
    {
        if ($rule->min_weight !== null && $totalWeight < (float) $rule->min_weight) {
            return false;
        }

        if ($rule->max_weight !== null && $totalWeight > (float) $rule->max_weight) {
            return false;
        }

        return true;
    }

    private function matchesZipRange(ShippingRule $rule, string $cep): bool
    {
        $ranges = $rule->zip_ranges;

        if (empty($ranges)) {
            return true;
        }

        $cep = preg_replace('/\D/', '', $cep);

        foreach ($ranges as $range) {
            $start = preg_replace('/\D/', '', $range['start'] ?? '');
            $end   = preg_replace('/\D/', '', $range['end'] ?? '');

            if ($start && $end && $cep >= $start && $cep <= $end) {
                return true;
            }
        }

        return false;
    }
}
