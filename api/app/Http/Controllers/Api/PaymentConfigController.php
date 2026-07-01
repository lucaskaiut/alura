<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentConfigController extends Controller
{
    public function index(): JsonResponse
    {
        $configs = PaymentConfig::paginate(20);

        $configs->getCollection()->transform(function ($config) {
            return $config->makeHidden('credentials');
        });

        return response()->json($configs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gateway' => 'required|string|max:255',
            'method' => 'required|in:pix,credit_card,boleto',
            'label' => 'nullable|string|max:255',
            'credentials' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $config = PaymentConfig::create($validated);

        return response()->json($config->makeHidden('credentials'), 201);
    }

    public function show(PaymentConfig $paymentConfig): JsonResponse
    {
        return response()->json($paymentConfig->makeHidden('credentials'));
    }

    public function update(Request $request, PaymentConfig $paymentConfig): JsonResponse
    {
        $validated = $request->validate([
            'gateway' => 'sometimes|string|max:255',
            'method' => 'sometimes|in:pix,credit_card,boleto',
            'label' => 'nullable|string|max:255',
            'credentials' => 'nullable|array',
            'status' => 'boolean',
        ]);

        $paymentConfig->update($validated);

        return response()->json($paymentConfig->makeHidden('credentials'));
    }

    public function destroy(PaymentConfig $paymentConfig): JsonResponse
    {
        $paymentConfig->delete();

        return response()->json(null, 204);
    }
}
