<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class PaymentConfig extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'gateway',
        'method',
        'credentials',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'array',
            'status' => 'boolean',
        ];
    }
}
