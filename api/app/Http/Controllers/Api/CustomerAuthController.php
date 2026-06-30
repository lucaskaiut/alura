<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CustomerAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou senha inválidos.'],
            ]);
        }

        $token = $customer->createToken('customer-token', expiresAt: now()->addDays(30));

        return response()->json([
            'customer' => $customer->only(['id', 'name', 'email', 'phone', 'document']),
            'token' => $token->plainTextToken,
        ])->cookie('njord_token', $token->plainTextToken, 60 * 24 * 30, '/', 'localhost', false, true); // httpOnly
    }

    public function me(Request $request): JsonResponse
    {
        $customer = $request->user();
        if (!$customer) {
            return response()->json(['authenticated' => false], 401);
        }
        return response()->json([
            'authenticated' => true,
            'customer' => $customer->only(['id', 'name', 'email', 'phone', 'document']),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $tenantId = tenant_id();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:customers,email,NULL,id,tenant_id,' . $tenantId,
            'password' => 'required|string|min:6|confirmed',
        ]);

        $customer = Customer::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => true,
            'accepts_marketing' => $request->boolean('accepts_marketing', false),
        ]);

        $token = $customer->createToken('customer-token', expiresAt: now()->addDays(30));

        return response()->json([
            'customer' => $customer->only(['id', 'name', 'email', 'phone', 'document']),
            'token' => $token->plainTextToken,
        ], 201)->cookie('njord_token', $token->plainTextToken, 60 * 24 * 30, '/', 'localhost', false, true);
    }
}
