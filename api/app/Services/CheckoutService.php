<?php

namespace App\Services;

use App\Core\Payment\PaymentCore;
use App\Core\Payment\DTOs\PaymentRequest;
use App\Core\Shipping\ShippingCore;
use App\Core\Shipping\DTOs\ShippingRequest;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private PaymentCore $payment,
        private ShippingCore $shipping,
        private PaymentSyncService $paymentSync,
        private CouponService $couponService,
    ) {}

    public function getShippingOptions(Cart $cart, string $cep): array
    {
        $cart->load('items.product');
        $items = $cart->items->map(fn ($i) => [
            'product_id' => $i->product_id,
            'name' => $i->product->name,
            'quantity' => $i->quantity,
            'weight' => (float) ($i->product->weight ?? 0.5),
        ])->toArray();

        $total = (float) $cart->items->sum(fn ($i) => (float) $i->price_at_time * $i->quantity);

        $request = new ShippingRequest(
            cep: $cep,
            items: $items,
            total: $total,
        );

        return collect($this->shipping->calculateAll($request))
            ->map(fn ($o) => [
                'service_code' => $o->serviceCode,
                'name' => $o->name,
                'price' => $o->price,
                'estimated_days' => $o->deliveryDays,
                'gateway' => $o->gateway,
            ])
            ->values()
            ->all();
    }

    public function getPaymentMethods(): array
    {
        return \App\Models\PaymentConfig::where('status', true)
            ->get()
            ->map(fn ($config) => [
                'gateway' => $config->gateway,
                'method' => strtolower($config->method),         // identificador interno (pix, credit_card, boleto)
                'type' => strtolower($config->method),           // tipo do formulário (pix, credit_card, boleto)
                'label' => $config->label ?: ucfirst($config->method), // nome de exibição
                'description' => $config->credentials['description'] ?? '',
            ])
            ->values()
            ->all();
    }

    public function checkout(Cart $cart, array $data): array
    {
        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Carrinho vazio.']);
        }

        // Validate each item
        foreach ($cart->items as $item) {
            $product = $item->product;
            if (!$product || !$product->status) {
                throw ValidationException::withMessages(['cart' => "{$product?->name}: produto indisponível."]);
            }
            $available = $item->variant ? (int) $item->variant->stock : (int) $product->stock;
            if ($available < $item->quantity) {
                throw ValidationException::withMessages(['cart' => "{$product->name}: estoque insuficiente."]);
            }
        }

        // Calculate totals server-side
        $subtotal = '0';
        foreach ($cart->items as $item) {
            $subtotal = bcadd($subtotal, bcmul((string) $item->price_at_time, (string) $item->quantity, 4), 2);
        }
        $shippingCost = $data['shipping_cost'] ?? '0';

        // Revalidate coupon if present
        $discount = '0';
        $couponId = null;
        $couponCode = null;
        $couponType = null;

        if ($cart->coupon_id) {
            try {
                $coupon = Coupon::find($cart->coupon_id);
                if ($coupon) {
                    $this->couponService->checkCoupon($coupon, (float) $subtotal);
                    $discountValue = $this->couponService->calculateDiscount($coupon, (float) $subtotal);
                    $discount = (string) $discountValue;
                    $couponId = $coupon->id;
                    $couponCode = $coupon->code;
                    $couponType = $coupon->type;
                }
            } catch (ValidationException $e) {
                throw ValidationException::withMessages(['coupon' => 'Cupom inválido: ' . $e->getMessage()]);
            }
        }

        $total = bcsub(bcadd($subtotal, $shippingCost, 2), $discount, 2);

        return DB::transaction(function () use ($cart, $data, $subtotal, $total, $shippingCost, $discount, $couponId, $couponCode, $couponType) {
            // Reserve stock with lock
            foreach ($cart->items as $item) {
                $variant = $item->variant;
                if ($variant) {
                    $variant = ProductVariant::where('id', $variant->id)->lockForUpdate()->first();
                    if ($variant) $variant->decrement('stock', $item->quantity);
                } else {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) $product->decrement('stock', $item->quantity);
                }
            }

            $order = Order::create([
                'number' => $this->generateOrderNumber(),
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
                'coupon_type' => $couponType,
                'shipping_address' => $data['address'] ?? null,
                'shipping_method' => $data['shipping_method'] ?? null,
                'status_id' => \App\Models\OrderStatus::where('payment_status', 'pending')->value('id')
                    ?? \App\Models\OrderStatus::where('is_default', true)->value('id')
                    ?? \App\Models\OrderStatus::first()?->id,
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'name_snapshot' => $item->product->name,
                    'sku_snapshot' => $item->product->sku ?? $item->variant?->sku,
                    'price' => $item->price_at_time,
                    'quantity' => $item->quantity,
                ]);
            }

            // Build payment-specific metadata
            $paymentMetadata = [];
            if (strtolower($data['payment_method'] ?? '') === 'credit_card') {
                $paymentMetadata['card_number'] = $data['card_number'] ?? '';
                $paymentMetadata['card_name'] = $data['card_name'] ?? '';
                $paymentMetadata['card_expiry'] = $data['card_expiry'] ?? '';
                $paymentMetadata['card_cvv'] = $data['card_cvv'] ?? '';
                $paymentMetadata['installments'] = $data['installments'] ?? 1;
            }

            // Process payment via PaymentCore
            $paymentRequest = new PaymentRequest(
                gateway: $data['payment_gateway'] ?? 'pix',
                method: $data['payment_method'] ?? 'pix',
                orderId: $order->id,
                amount: (float) $total,
                customer: $data['customer'] ?? [],
                metadata: $paymentMetadata,
            );

            $result = $this->payment->charge($paymentRequest);

            if (!$result->success) {
                throw ValidationException::withMessages([
                    'payment' => $result->message ?? 'Falha ao processar pagamento.',
                ]);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'gateway' => $data['payment_gateway'] ?? 'pix',
                'method' => $data['payment_method'] ?? 'pix',
                'transaction_id' => $result->transactionId,
                'amount' => $total,
                'status' => $result->status,
                'metadata' => [
                    'qr_code' => $result->qrCode,
                    'pix_code' => $result->pixCode,
                    'boleto_url' => $result->boletoUrl,
                    'boleto_digitable_line' => $result->boletoDigitableLine,
                    'payment_data' => $paymentMetadata,
                ],
            ]);

            $cart->items()->delete();

            // Sync order status based on payment result
            $order->load('payments');
            $this->paymentSync->syncOrderStatus($order);

            return [
                'order' => $order->load('items'),
                'payment' => $payment->only(['id', 'gateway', 'method', 'transaction_id', 'amount', 'status', 'metadata']),
                'payment_data' => [
                    'status' => $result->status,
                    'qr_code' => $result->qrCode,
                    'pix_code' => $result->pixCode,
                    'boleto_url' => $result->boletoUrl,
                    'boleto_digitable_line' => $result->boletoDigitableLine,
                ],
            ];
        });
    }

    private function generateOrderNumber(): string
    {
        $prefix = 'ORD-';
        $last = Order::latest('id')->first();
        $next = $last ? ((int) substr((string) $last->number, strlen($prefix))) + 1 : 1001;
        return $prefix . $next;
    }
}
