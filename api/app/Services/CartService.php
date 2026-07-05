<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Coupon;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(
        private CouponService $couponService,
    ) {}

    public function resolveCart(Request $request): ?Cart
    {
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');
        if ($sessionId) {
            return Cart::where('session_id', $sessionId)
                ->where('expires_at', '>', now())
                ->first();
        }
        return null;
    }

    public function resolveOrCreateCart(Request $request): Cart
    {
        $cart = $this->resolveCart($request);
        if ($cart) return $cart;

        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id')
            ?? 'sess_' . Str::random(32);

        return Cart::create([
            'session_id' => $sessionId,
            'expires_at' => now()->addDays(7),
        ]);
    }

    public function calculateSubtotal(Cart $cart): string
    {
        $subtotal = '0';
        foreach ($cart->items as $item) {
            $subtotal = bcadd($subtotal, bcmul((string) $item->price_at_time, (string) $item->quantity, 4), 2);
        }
        return $subtotal;
    }

    public function calculateTotal(Cart $cart): string
    {
        return bcsub($this->calculateSubtotal($cart), (string) $cart->discount, 2);
    }

    public function applyCoupon(Cart $cart, string $code): array
    {
        // Remove existing coupon if any
        if ($cart->coupon_id) {
            $this->releaseCoupon($cart);
        }

        $subtotal = (float) $this->calculateSubtotal($cart);
        $result = $this->couponService->apply($code, $subtotal);

        $coupon = $result['coupon'];
        $discount = $result['discount'];

        $cart->update([
            'coupon_id' => $coupon['id'],
            'coupon_code' => $coupon['code'],
            'coupon_type' => $coupon['type'],
            'discount' => $discount,
        ]);

        return [
            'coupon' => ['code' => $coupon['code'], 'type' => $coupon['type'], 'discount' => $discount],
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $this->calculateTotal($cart),
        ];
    }

    public function removeCoupon(Cart $cart): void
    {
        if ($cart->coupon_id) {
            $this->releaseCoupon($cart);
            $cart->update([
                'coupon_id' => null,
                'coupon_code' => null,
                'coupon_type' => null,
                'discount' => 0,
            ]);
        }
    }

    /**
     * Revalidate the coupon on the cart after item changes.
     * If coupon is no longer valid (e.g., subtotal below minimum), silently remove it.
     */
    public function revalidateCoupon(Cart $cart): void
    {
        if (!$cart->coupon_id || !$cart->coupon_code) return;

        $subtotal = (float) $this->calculateSubtotal($cart);

        try {
            $coupon = Coupon::find($cart->coupon_id);
            if (!$coupon) {
                $this->clearCoupon($cart);
                return;
            }

            $this->couponService->checkCoupon($coupon, $subtotal);

            $discount = $this->couponService->calculateDiscount($coupon, $subtotal);
            $cart->update(['discount' => $discount]);
        } catch (ValidationException $e) {
            $this->clearCoupon($cart);
        }
    }

    private function releaseCoupon(Cart $cart): void
    {
        if ($cart->coupon_id) {
            $coupon = Coupon::find($cart->coupon_id);
            if ($coupon) {
                $this->couponService->release($coupon);
            }
        }
    }

    private function clearCoupon(Cart $cart): void
    {
        $cart->update([
            'coupon_id' => null,
            'coupon_code' => null,
            'coupon_type' => null,
            'discount' => 0,
        ]);
    }
}
