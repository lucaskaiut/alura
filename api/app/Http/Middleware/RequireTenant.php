<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireTenant
{
    public function handle(Request $request, Closure $next)
    {
        // X-Tenant-Id exige autenticação (admin)
        if ($request->header('X-Tenant-Id') && !$request->user()) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        if (!tenant()) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        return $next($request);
    }
}
