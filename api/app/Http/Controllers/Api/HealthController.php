<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            $database = 'ok';
        } catch (\Exception $e) {
            $database = 'error';
        }

        $healthy = $database === 'ok';

        return response()->json([
            'status' => $healthy ? 'healthy' : 'unhealthy',
            'database' => $database,
        ], $healthy ? 200 : 503);
    }
}
