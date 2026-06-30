<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $stocks = Stock::with(['product', 'productVariant'])
            ->where('product_id', $request->input('product_id'))
            ->orWhereHas('productVariant', function ($q) use ($request) {
                $q->where('product_id', $request->input('product_id'));
            })
            ->get();

        return response()->json($stocks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer',
            'reason' => 'nullable|string|max:255',
            'order_id' => 'nullable|exists:orders,id',
            'metadata' => 'nullable|array',
        ]);

        if (empty($validated['product_id']) && empty($validated['product_variant_id'])) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                response()->json([
                    'message' => 'Either product_id or product_variant_id is required.',
                ], 422)
            );
        }

        $movement = DB::transaction(function () use ($validated, $request) {
            $stock = Stock::where('product_id', $validated['product_id'] ?? null)
                ->where('product_variant_id', $validated['product_variant_id'] ?? null)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                $stock = Stock::create([
                    'tenant_id' => tenant_id(),
                    'product_id' => $validated['product_id'] ?? null,
                    'product_variant_id' => $validated['product_variant_id'] ?? null,
                    'quantity' => 0,
                    'reserved' => 0,
                    'min_quantity' => 0,
                ]);
            }

            $movement = $stock->movements()->create([
                'type' => 'adjust',
                'quantity' => $validated['quantity'],
                'reason' => $validated['reason'] ?? null,
                'user_id' => $request->user()?->id,
                'order_id' => $validated['order_id'] ?? null,
                'metadata' => $validated['metadata'] ?? null,
            ]);

            $stock->update([
                'quantity' => $stock->quantity + $validated['quantity'],
            ]);

            return $movement;
        });

        return response()->json($movement->load('stock'), 201);
    }

    public function history(Stock $stock, Request $request): JsonResponse
    {
        $movements = $stock->movements()
            ->with(['user'])
            ->latest()
            ->paginate($request->input('per_page', 20));

        return response()->json($movements);
    }
}
