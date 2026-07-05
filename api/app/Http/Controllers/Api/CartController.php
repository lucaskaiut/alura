<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\AuditService;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function __construct(
        private AuditService $auditService,
        private CartService $cartService,
    ) {}

    public function get(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);

        if (!$cart) {
            return response()->json(['items' => [], 'subtotal' => 0, 'discount' => 0, 'total' => 0, 'coupon' => null]);
        }

        $cart->load(['items.product.media', 'items.variant.attributeValues', 'items.variant.media']);

        return response()->json([
            'id' => $cart->id,
            'items' => $cart->items,
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => (float) $cart->discount,
            'total' => $this->cartService->calculateTotal($cart),
            'coupon' => $cart->coupon_code ? [
                'id' => $cart->coupon_id,
                'code' => $cart->coupon_code,
                'type' => $cart->coupon_type,
                'discount' => (float) $cart->discount,
            ] : null,
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'integer|min:1|max:99',
        ]);

        $quantity = $validated['quantity'] ?? 1;
        $product = Product::with('variants', 'media')->findOrFail($validated['product_id']);
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');

        if (!$product->status) {
            return response()->json(['message' => 'Produto indisponível.'], 422);
        }

        $variant = null;
        $price = $product->price;

        if (!empty($validated['variant_id'])) {
            $variant = $product->variants->find($validated['variant_id']);
            if (!$variant) {
                return response()->json(['message' => 'Variação não encontrada.'], 422);
            }
            $price = $variant->price ?? $product->price;
        }

        if ($product->is_variable && !$variant) {
            return response()->json(['message' => 'Selecione uma variação.'], 422);
        }

        try {
            $cart = DB::transaction(function () use ($request, $validated, $quantity, $product, $variant, $price, $sessionId) {
                $available = $variant ? (int) $variant->stock : (int) $product->stock;

                if ($available <= 0) {
                    throw new \RuntimeException('Produto sem estoque.');
                }

                $cart = $this->cartService->resolveOrCreateCart($request);

                $existingItem = $cart->items()
                    ->where('product_id', $validated['product_id'])
                    ->where('variant_id', $validated['variant_id'] ?? null)
                    ->first();

                if ($existingItem) {
                    $newQty = $existingItem->quantity + $quantity;
                    if ($newQty > $available) {
                        throw new \RuntimeException("Estoque insuficiente. Disponível: {$available}");
                    }
                    $existingItem->update(['quantity' => $newQty, 'price_at_time' => $price]);
                } else {
                    if ($quantity > $available) {
                        throw new \RuntimeException("Estoque insuficiente. Disponível: {$available}");
                    }
                    $cart->items()->create([
                        'product_id' => $validated['product_id'],
                        'variant_id' => $validated['variant_id'] ?? null,
                        'quantity' => $quantity,
                        'price_at_time' => $price,
                    ]);
                }

                $this->cartService->revalidateCoupon($cart);

                $this->auditService->log('cart_add_item', [
                    'session_id' => $sessionId,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'variant_id' => $variant->id ?? null,
                    'quantity' => $quantity,
                    'available' => $available,
                ]);

                return $cart;
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $cart->load(['items.product.media', 'items.variant.attributeValues', 'items.variant.media']);

        return response()->json([
            'id' => $cart->id,
            'items' => $cart->items,
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => (float) $cart->discount,
            'total' => $this->cartService->calculateTotal($cart),
            'coupon' => $cart->coupon_code ? [
                'id' => $cart->coupon_id,
                'code' => $cart->coupon_code,
                'type' => $cart->coupon_type,
                'discount' => (float) $cart->discount,
            ] : null,
        ]);
    }

    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');

        if (!$sessionId || $cartItem->cart->session_id !== $sessionId) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }

        $validated = $request->validate(['quantity' => 'required|integer|min:1|max:99']);

        $product = $cartItem->product;
        $variant = $cartItem->variant;
        $available = $variant ? (int) $variant->stock : (int) $product->stock;

        if ($validated['quantity'] > $available) {
            return response()->json(['message' => "Estoque insuficiente. Disponível: {$available}"], 422);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        $cart = $cartItem->cart;
        $this->cartService->revalidateCoupon($cart);
        $cart->load(['items.product.media', 'items.variant.attributeValues', 'items.variant.media']);

        return response()->json([
            'items' => $cart->items,
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => (float) $cart->discount,
            'total' => $this->cartService->calculateTotal($cart),
            'coupon' => $cart->coupon_code ? [
                'id' => $cart->coupon_id,
                'code' => $cart->coupon_code,
                'type' => $cart->coupon_type,
                'discount' => (float) $cart->discount,
            ] : null,
        ]);
    }

    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');

        if (!$sessionId || $cartItem->cart->session_id !== $sessionId) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }

        $cart = $cartItem->cart;
        $cartItem->delete();

        $this->cartService->revalidateCoupon($cart);
        $cart->load(['items.product.media', 'items.variant.attributeValues', 'items.variant.media']);

        return response()->json([
            'items' => $cart->items,
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => (float) $cart->discount,
            'total' => $this->cartService->calculateTotal($cart),
            'coupon' => $cart->coupon_code ? [
                'id' => $cart->coupon_id,
                'code' => $cart->coupon_code,
                'type' => $cart->coupon_type,
                'discount' => (float) $cart->discount,
            ] : null,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        if ($cart) {
            $this->cartService->removeCoupon($cart);
            $cart->items()->delete();
        }
        return response()->json(['items' => [], 'subtotal' => 0, 'discount' => 0, 'total' => 0, 'coupon' => null]);
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $cart = $this->cartService->resolveOrCreateCart($request);

        if (!$cart->items->count()) {
            return response()->json(['message' => 'Carrinho vazio.'], 422);
        }

        try {
            $result = $this->cartService->applyCoupon($cart, $request->code);
            return response()->json(['applied' => true, ...$result]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);
        if ($cart) {
            $this->cartService->removeCoupon($cart);
        }
        return response()->json(['removed' => true, 'coupon' => null, 'discount' => 0]);
    }

    public function validateCart(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveCart($request);

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['valid' => false, 'message' => 'Carrinho vazio.', 'items' => [], 'subtotal' => 0, 'discount' => 0, 'total' => 0]);
        }

        if ($cart->coupon_id) {
            $this->cartService->revalidateCoupon($cart);
            $cart->refresh();
        }

        $warnings = [];
        foreach ($cart->items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            if (!$product || !$product->status) {
                $warnings[] = "{$item->name_snapshot}: produto indisponível.";
                continue;
            }

            $currentPrice = $variant ? ($variant->price ?? $product->price) : $product->price;
            $available = $variant ? (int) $variant->stock : (int) $product->stock;

            if ($available <= 0) {
                $warnings[] = "{$product->name}: sem estoque.";
                continue;
            }

            $qty = min($item->quantity, $available);
            if ($qty < $item->quantity) {
                $warnings[] = "{$product->name}: quantidade ajustada para {$qty}.";
            }

            if (abs((float) $item->price_at_time - (float) $currentPrice) > 0.01) {
                $item->update(['price_at_time' => $currentPrice, 'quantity' => $qty]);
                $warnings[] = "{$product->name}: preço atualizado.";
            } elseif ($qty !== $item->quantity) {
                $item->update(['quantity' => $qty]);
            }
        }

        $cart->refresh()->load(['items.product.media', 'items.variant.attributeValues', 'items.variant.media']);

        return response()->json([
            'valid' => empty($warnings),
            'warnings' => $warnings,
            'items' => $cart->items,
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => (float) $cart->discount,
            'total' => $this->cartService->calculateTotal($cart),
            'coupon' => $cart->coupon_code ? [
                'id' => $cart->coupon_id,
                'code' => $cart->coupon_code,
                'type' => $cart->coupon_type,
                'discount' => (float) $cart->discount,
            ] : null,
        ]);
    }
}
