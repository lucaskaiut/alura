<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::paginate(20);
        return response()->json($coupons);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed,free_shipping',
            'value' => 'required|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
            'max_uses' => 'nullable|integer|min:1',
            'min_order_value' => 'nullable|numeric|min:0',
            'status' => 'boolean',
        ]);

        $coupon = Coupon::create($validated);
        return response()->json($coupon, 201);
    }

    public function show(Coupon $coupon): JsonResponse
    {
        return response()->json($coupon);
    }

    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:percentage,fixed,free_shipping',
            'value' => 'sometimes|numeric|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
            'max_uses' => 'nullable|integer|min:1',
            'min_order_value' => 'nullable|numeric|min:0',
            'status' => 'boolean',
        ]);

        $coupon->update($validated);
        return response()->json($coupon);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();
        return response()->json(null, 204);
    }

    /** Validate a coupon code for a given cart total */
    public function validate(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'cart_total' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon) {
            throw ValidationException::withMessages(['code' => 'Cupom não encontrado.']);
        }

        $this->checkCoupon($coupon, (float) $request->cart_total);

        return response()->json([
            'valid' => true,
            'coupon' => $coupon->only(['id', 'code', 'type', 'value']),
            'discount' => $this->calculateDiscount($coupon, (float) $request->cart_total),
        ]);
    }

    /** Apply coupon (increment used_count atomically) */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string',
            'cart_total' => 'required|numeric|min:0',
        ]);

        $coupon = DB::transaction(function () use ($request) {
            $coupon = Coupon::where('code', $request->code)->lockForUpdate()->first();

            if (!$coupon) {
                throw ValidationException::withMessages(['code' => 'Cupom não encontrado.']);
            }

            $this->checkCoupon($coupon, (float) $request->cart_total);

            $coupon->increment('used_count');

            return $coupon;
        });

        return response()->json([
            'applied' => true,
            'coupon' => $coupon->only(['id', 'code', 'type', 'value']),
            'discount' => $this->calculateDiscount($coupon, (float) $request->cart_total),
        ]);
    }

    private function checkCoupon(Coupon $coupon, float $cartTotal): void
    {
        if (!$coupon->status) {
            throw ValidationException::withMessages(['code' => 'Cupom inativo.']);
        }

        if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
            throw ValidationException::withMessages(['code' => 'Cupom ainda não disponível.']);
        }

        if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
            throw ValidationException::withMessages(['code' => 'Cupom expirado.']);
        }

        if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
            throw ValidationException::withMessages(['code' => 'Cupom esgotado.']);
        }

        if ($coupon->min_order_value && $cartTotal < $coupon->min_order_value) {
            throw ValidationException::withMessages([
                'code' => "Pedido mínimo de R$ " . number_format($coupon->min_order_value, 2, ',', '.'),
            ]);
        }
    }

    private function calculateDiscount(Coupon $coupon, float $cartTotal): float
    {
        return match ($coupon->type) {
            'percentage' => round($cartTotal * ($coupon->value / 100), 2),
            'fixed' => min((float) $coupon->value, $cartTotal),
            'free_shipping' => 0, // Shipping discount handled separately
            default => 0,
        };
    }
}
