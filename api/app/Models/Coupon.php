<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'code',
        'type',
        'value',
        'starts_at',
        'expires_at',
        'max_uses',
        'used_count',
        'min_order_value',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'min_order_value' => 'decimal:2',
            'status' => 'boolean',
        ];
    }
}
