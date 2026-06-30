<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AuditService
{
    public function log(string $action, array $context = []): void
    {
        Log::channel('audit')->info("[AUDIT] {$action}", $context);
    }
}
