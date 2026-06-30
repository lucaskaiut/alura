<?php

use App\Models\Tenant;

if (!function_exists('tenant')) {
    function tenant(): ?Tenant
    {
        return app()->bound('current_tenant') ? app('current_tenant') : null;
    }
}

if (!function_exists('tenant_id')) {
    function tenant_id(): ?int
    {
        return app()->bound('tenant_id') ? app('tenant_id') : null;
    }
}
