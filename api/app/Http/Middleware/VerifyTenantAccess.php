<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyTenantAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $tenantId = tenant_id();

        // Só aplica se houver tenant definido E usuário autenticado
        if ($tenantId && $user) {
            $belongs = $user->tenants()->where('tenant_id', $tenantId)->exists();
            if (!$belongs) {
                return response()->json(['message' => 'Access denied to this tenant.'], 403);
            }
        }

        // Se X-Tenant-Id foi usado sem autenticação, bloqueia
        if ($request->header('X-Tenant-Id') && !$user) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        return $next($request);
    }
}
