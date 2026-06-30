<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next)
    {
        // Admin: tenant explícito via X-Tenant-Id
        if ($tenantId = $request->header('X-Tenant-Id')) {
            $tenant = Tenant::where('id', $tenantId)->where('status', true)->first();

            if (!$tenant) {
                return response()->json(['message' => 'Tenant not found'], 404);
            }

            app()->instance('current_tenant', $tenant);
            app()->instance('tenant_id', $tenant->id);

            return $next($request);
        }

        // Store: tenant por domínio (X-Tenant-Domain header ou Host)
        $domain = $this->normalizeDomain($request->header('X-Tenant-Domain'));

        if (!$domain) {
            $domain = $this->normalizeDomain($request->getHost());
        }

        if ($domain) {
            $tenant = Tenant::where('domain', $domain)->where('status', true)->first();

            if ($tenant) {
                app()->instance('current_tenant', $tenant);
                app()->instance('tenant_id', $tenant->id);
            }
        }

        return $next($request);
    }

    private function normalizeDomain(?string $domain): ?string
    {
        if (!$domain) return null;

        // Remove protocol
        $domain = preg_replace('#^https?://#', '', $domain);
        // Remove port
        $domain = explode(':', $domain)[0];
        // Remove www.
        $domain = preg_replace('#^www\.#', '', $domain);
        // Lowercase
        $domain = strtolower(trim($domain));

        return $domain ?: null;
    }
}
