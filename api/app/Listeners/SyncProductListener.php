<?php

namespace App\Listeners;

use App\Events\ProductChanged;
use App\Jobs\SyncProductToOpenSearch;

class SyncProductListener
{
    public function handle(ProductChanged $event): void
    {
        $action = match ($event->action) {
            'deleted' => 'delete',
            default => 'index',
        };

        SyncProductToOpenSearch::dispatch($event->product->id, $action);
    }
}
