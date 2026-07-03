<?php

namespace App\Jobs;

use App\Services\OpenSearch\ProductSearchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncProductToOpenSearch implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private int $productId,
        private string $action, // 'index' or 'delete'
    ) {}

    public function handle(ProductSearchService $service): void
    {
        $service->syncProduct($this->productId, $this->action);

        $this->revalidateCache();
    }

    private function revalidateCache(): void
    {
        $nextjsUrl = env('NEXTJS_INTERNAL_URL');
        $token = env('REVALIDATE_TOKEN', 'alura-revalidate-secret');

        if (!$nextjsUrl) {
            return;
        }

        try {
            Http::withHeaders(['x-revalidate-token' => $token])
                ->post("{$nextjsUrl}/api/revalidate", ['path' => '/busca']);
        } catch (\Throwable $e) {
            Log::warning('Failed to revalidate Next.js cache', [
                'error' => $e->getMessage(),
                'product_id' => $this->productId,
            ]);
        }
    }
}
