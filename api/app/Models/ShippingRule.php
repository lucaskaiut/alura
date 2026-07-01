<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ShippingRule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'gateway',
        'service_code',
        'free_from',
        'min_value',
        'max_weight',
        'min_weight',
        'zip_ranges',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'free_from' => 'decimal:2',
            'min_value' => 'decimal:2',
            'max_weight' => 'decimal:3',
            'min_weight' => 'decimal:3',
            'zip_ranges' => 'array',
            'status' => 'boolean',
        ];
    }
}
