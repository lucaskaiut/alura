<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Scopes\TenantScope;
use App\Services\OpenSearch\ProductSearchService;
use Illuminate\Console\Command;

class ReindexProducts extends Command
{
    protected $signature = 'opensearch:reindex-products {--tenant= : Reindex only for a specific tenant ID}';
    protected $description = 'Reindex all products into OpenSearch';

    public function handle(ProductSearchService $service): int
    {
        $this->info('Creating index...');
        $service->createIndex();

        $query = Product::withoutGlobalScope(TenantScope::class)->where('status', true);

        if ($tenantId = $this->option('tenant')) {
            $query->where('tenant_id', $tenantId);
        }

        $count = $query->count();
        $this->info("Indexing {$count} products...");

        $bar = $this->output->createProgressBar($count);

        foreach ($query->cursor() as $product) {
            $service->indexProduct($product->id);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Reindex complete.');

        return self::SUCCESS;
    }
}
