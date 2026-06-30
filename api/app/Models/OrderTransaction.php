<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderTransaction extends Model
{
    protected $fillable = [
        'order_id',
        'type',
        'data',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
