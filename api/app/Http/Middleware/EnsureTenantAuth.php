<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTenantAuth
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tenantId = tenant_id();

        if (!$tenantId) {
            return response()->json(['message' => 'Tenant not identified.'], 404);
        }

        $belongsToTenant = $user->tenants()
            ->where('tenant_id', $tenantId)
            ->exists();

        if (!$belongsToTenant) {
            return response()->json(['message' => 'Access denied to this tenant.'], 403);
        }

        return $next($request);
    }
}
