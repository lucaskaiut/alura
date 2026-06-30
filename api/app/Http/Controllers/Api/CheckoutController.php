<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(private CheckoutService $checkout) {}

    public function shipping(Request $request): JsonResponse
    {
        $request->validate(['cep' => 'required|string|size:8', 'session_id' => 'required|string']);

        $cart = Cart::where('session_id', $request->session_id)->with('items.product')->first();
        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['options' => []]);
        }

        $options = $this->checkout->getShippingOptions($cart, $request->cep);
        return response()->json(['options' => $options]);
    }

    public function paymentMethods(): JsonResponse
    {
        return response()->json(['methods' => $this->checkout->getPaymentMethods()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
            'customer_id' => 'nullable|integer',
            'address' => 'required|array',
            'address.zip_code' => 'required|string',
            'address.street' => 'required|string',
            'address.number' => 'required|string',
            'address.neighborhood' => 'required|string',
            'address.city' => 'required|string',
            'address.state' => 'required|string|size:2',
            'shipping_method' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric',
            'payment_gateway' => 'required|string',
            'payment_method' => 'required|string',
            'discount' => 'nullable|numeric',
        ]);

        $cart = Cart::where('session_id', $validated['session_id'])->with('items.product')->first();
        if (!$cart) {
            return response()->json(['message' => 'Carrinho não encontrado.'], 404);
        }

        try {
            $result = $this->checkout->checkout($cart, $validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        }

        return response()->json($result, 201);
    }
}
