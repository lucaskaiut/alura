<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Stock;
use App\Services\AuditService;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function __construct(private AuditService $auditService) {}

    public function get(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);

        if (!$cart) {
            return response()->json(['items' => [], 'total' => 0]);
        }

        $cart->load(['items.product.media', 'items.variant']);

        return response()->json([
            'id' => $cart->id,
            'items' => $cart->items,
            'total' => $this->calculateTotal($cart),
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

        // Validate product
        if (!$product->status) {
            return response()->json(['message' => 'Produto indisponível.'], 422);
        }

        // Determine price and variant
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
                // Validate stock with lockForUpdate to prevent race conditions
                $stock = $variant
                    ? Stock::where('product_variant_id', $variant->id)->lockForUpdate()->first()
                    : Stock::where('product_id', $product->id)->lockForUpdate()->first();

                $available = $stock ? max(0, $stock->quantity - $stock->reserved) : 0;

                if ($available <= 0) {
                    throw new \RuntimeException('Produto sem estoque.');
                }

                // Get or create cart
                $cart = $this->resolveOrCreateCart($request);

                // Check existing
                $existingItem = $cart->items()
                    ->where('product_id', $validated['product_id'])
                    ->where('variant_id', $validated['variant_id'] ?? null)
                    ->first();

                if ($existingItem) {
                    $newQty = $existingItem->quantity + $quantity;
                    if ($newQty > $available) {
                        throw new \RuntimeException("Estoque insuficiente. Disponível: {$available}");
                    }
                    $existingItem->update([
                        'quantity' => $newQty,
                        'price_at_time' => $price,
                    ]);
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

        $cart->load(['items.product.media', 'items.variant']);

        return response()->json([
            'id' => $cart->id,
            'items' => $cart->items,
            'total' => $this->calculateTotal($cart),
        ]);
    }

    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');

        if (!$sessionId || $cartItem->cart->session_id !== $sessionId) {
            return response()->json(['message' => 'Acesso não autorizado.'], 403);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        $product = $cartItem->product;
        $variant = $cartItem->variant;

        $stock = $variant
            ? Stock::where('product_variant_id', $variant->id)->lockForUpdate()->first()
            : Stock::where('product_id', $product->id)->lockForUpdate()->first();

        $available = $stock ? max(0, $stock->quantity - $stock->reserved) : 0;

        if ($validated['quantity'] > $available) {
            return response()->json(['message' => "Estoque insuficiente. Disponível: {$available}"], 422);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        $cart = $cartItem->cart->load(['items.product.media', 'items.variant']);

        return response()->json([
            'items' => $cart->items,
            'total' => $this->calculateTotal($cart),
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

        $cart->load(['items.product.media', 'items.variant']);

        return response()->json([
            'items' => $cart->items,
            'total' => $this->calculateTotal($cart),
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['items' => [], 'total' => 0]);
    }

    /** Validate cart: re-check prices, stock, product status. Called before checkout. */
    public function validateCart(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['valid' => false, 'message' => 'Carrinho vazio.', 'items' => [], 'total' => 0]);
        }

        $warnings = [];
        $validItems = [];

        foreach ($cart->items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            if (!$product || !$product->status) {
                $warnings[] = "{$item->name_snapshot}: produto indisponível.";
                continue;
            }

            $currentPrice = $variant ? ($variant->price ?? $product->price) : $product->price;
            $stock = $variant ? $variant->stock()->first() : $product->stock()->first();
            $available = $stock ? max(0, $stock->quantity - $stock->reserved) : 0;

            if ($available <= 0) {
                $warnings[] = "{$product->name}: sem estoque.";
                continue;
            }

            $qty = min($item->quantity, $available);
            if ($qty < $item->quantity) {
                $warnings[] = "{$product->name}: quantidade ajustada para {$qty}.";
            }

            // Update price if changed
            if (abs((float) $item->price_at_time - (float) $currentPrice) > 0.01) {
                $item->update(['price_at_time' => $currentPrice, 'quantity' => $qty]);
                $warnings[] = "{$product->name}: preço atualizado.";
            } elseif ($qty !== $item->quantity) {
                $item->update(['quantity' => $qty]);
            }

            $validItems[] = $item;
        }

        $cart->refresh()->load(['items.product.media', 'items.variant']);

        return response()->json([
            'valid' => empty($warnings),
            'warnings' => $warnings,
            'items' => $cart->items,
            'total' => $this->calculateTotal($cart),
        ]);
    }

    private function calculateTotal(Cart $cart): string
    {
        $total = '0';
        foreach ($cart->items as $item) {
            $total = bcadd($total, bcmul((string) $item->price_at_time, (string) $item->quantity, 4), 2);
        }
        return $total;
    }

    private function resolveCart(Request $request): ?Cart
    {
        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id');

        if ($sessionId) {
            return Cart::where('session_id', $sessionId)
                ->where('expires_at', '>', now())
                ->first();
        }

        return null;
    }

    private function resolveOrCreateCart(Request $request): Cart
    {
        $cart = $this->resolveCart($request);

        if ($cart) {
            return $cart;
        }

        $sessionId = $request->input('session_id') ?? $request->header('X-Session-Id')
            ?? 'sess_' . Str::random(32);

        return Cart::create([
            'session_id' => $sessionId,
            'expires_at' => now()->addDays(7),
        ]);
    }
}
