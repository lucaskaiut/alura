<?php

namespace App\Services;

use App\Core\Payment\PaymentCore;
use App\Core\Payment\DTOs\PaymentRequest;
use App\Core\Shipping\ShippingCore;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private PaymentCore $payment,
        private ShippingCore $shipping,
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

        $total = $cart->items->sum(fn ($i) => (float) $i->price_at_time * $i->quantity);

        return collect($this->shipping->calculateAll([
            'cep' => $cep,
            'items' => $items,
            'total' => $total,
        ]))->map(fn ($o) => [
            'service_code' => $o->serviceCode,
            'name' => $o->name,
            'price' => $o->price,
            'estimated_days' => $o->deliveryDays,
            'gateway' => $o->gateway,
        ])->values()->all();
    }

    public function getPaymentMethods(): array
    {
        return \App\Models\PaymentConfig::where('status', true)
            ->get()
            ->map(fn ($config) => [
                'gateway' => $config->gateway,
                'method' => $config->method,
                'type' => $config->gateway, // 'pix', 'credit_card', 'boleto' — usado pelo frontend para decidir o formulário
                'label' => $config->method,
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
            $stock = $item->variant ? $item->variant->stock()->first() : $product->stock()->first();
            $available = $stock ? max(0, $stock->quantity - $stock->reserved) : 0;
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
        $discount = $data['discount'] ?? '0';
        $total = bcsub(bcadd($subtotal, $shippingCost, 2), $discount, 2);

        return DB::transaction(function () use ($cart, $data, $subtotal, $total, $shippingCost, $discount) {
            // Reserve stock with lock
            foreach ($cart->items as $item) {
                $stock = $item->variant
                    ? $item->variant->stock()->lockForUpdate()->first()
                    : $item->product->stock()->lockForUpdate()->first();
                if ($stock) $stock->increment('reserved', $item->quantity);
            }

            $order = Order::create([
                'number' => $this->generateOrderNumber(),
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'shipping_address' => $data['address'] ?? null,
                'shipping_method' => $data['shipping_method'] ?? null,
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

            // Process payment via PaymentCore
            $paymentRequest = new PaymentRequest(
                gateway: $data['payment_gateway'] ?? 'pix',
                method: $data['payment_method'] ?? 'pix',
                orderId: $order->id,
                amount: (float) $total,
                customer: $data['customer'] ?? [],
            );

            $result = $this->payment->charge($paymentRequest);

            $payment = Payment::create([
                'order_id' => $order->id,
                'gateway' => $data['payment_gateway'] ?? 'pix',
                'method' => $data['payment_method'] ?? 'pix',
                'transaction_id' => $result->transactionId,
                'amount' => $total,
                'status' => $result->status,
                'metadata' => [
                    'qr_code' => $result->qrCode,
                    'boleto_url' => $result->boletoUrl,
                ],
            ]);

            $cart->items()->delete();

            return [
                'order' => $order->load('items'),
                'payment' => $payment->only(['id', 'gateway', 'method', 'transaction_id', 'amount', 'status', 'metadata']),
                'payment_data' => [
                    'status' => $result->status,
                    'qr_code' => $result->qrCode,
                    'boleto_url' => $result->boletoUrl,
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
