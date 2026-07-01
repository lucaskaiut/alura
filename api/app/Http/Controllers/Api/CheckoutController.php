<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CustomerAddress;
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
        $rules = [
            'session_id' => 'required|string',
            'customer_id' => 'nullable|integer',
            'address_id' => 'nullable|integer|exists:customer_addresses,id',
            'address' => 'required_without:address_id|array',
            'address.zip_code' => 'required_without:address_id|string',
            'address.street' => 'required_without:address_id|string',
            'address.number' => 'required_without:address_id|string',
            'address.neighborhood' => 'required_without:address_id|string',
            'address.city' => 'required_without:address_id|string',
            'address.state' => 'required_without:address_id|string|size:2',
            'save_address' => 'nullable|boolean',
            'address_label' => 'nullable|string|max:255',
            'shipping_method' => 'nullable|string',
            'shipping_cost' => 'nullable|numeric',
            'payment_gateway' => 'required|string',
            'payment_method' => 'required|string',
            'discount' => 'nullable|numeric',
        ];

        if (strtolower($request->input('payment_method') ?? '') === 'credit_card') {
            $rules['card_number'] = 'required|string|min:13|max:19';
            $rules['card_name'] = 'required|string|min:3|max:100';
            $rules['card_expiry'] = 'required|string|size:5';
            $rules['card_cvv'] = 'required|string|min:3|max:4';
            $rules['installments'] = 'nullable|integer|min:1|max:12';
        }

        $validated = $request->validate($rules);

        // Resolve address_id to full address data
        if (!empty($validated['address_id'])) {
            $customerAddress = CustomerAddress::find($validated['address_id']);
            if (!$customerAddress) {
                return response()->json(['message' => 'Endereço não encontrado.'], 404);
            }
            $customerId = $validated['customer_id'] ?? null;
            if ($customerId && (int) $customerAddress->customer_id !== (int) $customerId) {
                return response()->json(['message' => 'Endereço não pertence ao cliente.'], 403);
            }
            $validated['address'] = [
                'zip_code' => $customerAddress->zip_code,
                'street' => $customerAddress->street,
                'number' => $customerAddress->number,
                'complement' => $customerAddress->complement,
                'neighborhood' => $customerAddress->neighborhood,
                'city' => $customerAddress->city,
                'state' => $customerAddress->state,
            ];
        }

        // Persist new address to customer if requested
        if (!empty($validated['save_address']) && !empty($validated['customer_id']) && empty($validated['address_id'])) {
            $addr = $validated['address'];
            CustomerAddress::create([
                'customer_id' => $validated['customer_id'],
                'type' => 'shipping',
                'label' => $validated['address_label'] ?? null,
                'zip_code' => $addr['zip_code'],
                'street' => $addr['street'],
                'number' => $addr['number'],
                'complement' => $addr['complement'] ?? '',
                'neighborhood' => $addr['neighborhood'],
                'city' => $addr['city'],
                'state' => $addr['state'],
            ]);
        }

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
