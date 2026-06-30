<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        if (!$user->status) {
            throw ValidationException::withMessages([
                'email' => ['Sua conta está inativa.'],
            ]);
        }

        $token = $user->createToken('api-token', expiresAt: now()->addDays(7));

        // Retorna tenants disponíveis para o usuário
        $tenants = $user->tenants()
            ->where('status', true)
            ->select('tenants.id', 'tenants.name', 'tenants.subdomain', 'tenants.logo_path')
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
            ],
            'token' => $token->plainTextToken,
            'tenants' => $tenants,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenantId = tenant_id();

        $tenants = $user->tenants()
            ->where('status', true)
            ->select('tenants.id', 'tenants.name', 'tenants.subdomain', 'tenants.logo_path')
            ->get();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'tenant_id' => $tenantId,
            'tenants' => $tenants,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
