<?php

namespace App\Services;

use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

class CouponService
{
    /**
     * Validate a coupon code for a given cart subtotal.
     * Returns the coupon and calculated discount on success, throws on failure.
     */
    public function validate(string $code, float $cartSubtotal): array
    {
        $coupon = Coupon::where('code', $code)->first();

        if (!$coupon) {
            throw ValidationException::withMessages(['coupon' => 'Cupom não encontrado.']);
        }

        $this->checkCoupon($coupon, $cartSubtotal);

        return [
            'coupon' => $coupon->only(['id', 'code', 'type', 'value', 'min_order_value']),
            'discount' => $this->calculateDiscount($coupon, $cartSubtotal),
        ];
    }

    /**
     * Apply a coupon: validate + atomically increment used_count.
     */
    public function apply(string $code, float $cartSubtotal): array
    {
        return \DB::transaction(function () use ($code, $cartSubtotal) {
            $coupon = Coupon::where('code', $code)->lockForUpdate()->first();

            if (!$coupon) {
                throw ValidationException::withMessages(['coupon' => 'Cupom não encontrado.']);
            }

            $this->checkCoupon($coupon, $cartSubtotal);

            $coupon->increment('used_count');

            return [
                'coupon' => $coupon->only(['id', 'code', 'type', 'value']),
                'discount' => $this->calculateDiscount($coupon, $cartSubtotal),
            ];
        });
    }

    /**
     * Release a coupon's used_count (e.g., when removed from cart).
     */
    public function release(Coupon $coupon): void
    {
        if ($coupon->used_count > 0) {
            $coupon->decrement('used_count');
        }
    }

    public function checkCoupon(Coupon $coupon, float $cartSubtotal): void
    {
        if (!$coupon->status) {
            throw ValidationException::withMessages(['coupon' => 'Cupom inativo.']);
        }

        if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
            throw ValidationException::withMessages(['coupon' => 'Cupom ainda não disponível.']);
        }

        if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
            throw ValidationException::withMessages(['coupon' => 'Cupom expirado.']);
        }

        if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
            throw ValidationException::withMessages(['coupon' => 'Cupom esgotado.']);
        }

        if ($coupon->min_order_value && $cartSubtotal < $coupon->min_order_value) {
            throw ValidationException::withMessages([
                'coupon' => 'Pedido mínimo de R$ ' . number_format($coupon->min_order_value, 2, ',', '.'),
            ]);
        }
    }

    public function calculateDiscount(Coupon $coupon, float $cartSubtotal): float
    {
        return match ($coupon->type) {
            'percentage' => round($cartSubtotal * ($coupon->value / 100), 2),
            'fixed' => min((float) $coupon->value, $cartSubtotal),
            'free_shipping' => 0,
            default => 0,
        };
    }
}
