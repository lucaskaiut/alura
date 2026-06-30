<?php

namespace App\Http\Controllers\Api;

use App\Core\Router\RouterService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouterController extends Controller
{
    public function resolve(Request $request, RouterService $router): JsonResponse
    {
        $path = $request->input('path', '/');

        $match = $router->resolve($path);

        return response()->json([
            'type' => $match->type,
            'data' => $match->data,
            'seo' => $match->seo,
            'status' => $match->status,
            'meta' => $match->meta,
        ], $match->status >= 400 ? $match->status : 200);
    }
}
