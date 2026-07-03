<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Foundation\Events\Dispatchable;

class ProductChanged
{
    use Dispatchable;

    public function __construct(
        public Product $product,
        public string $action, // 'created', 'updated', 'deleted'
    ) {}
}
