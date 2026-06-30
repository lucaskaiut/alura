<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatusTransition extends Model
{
    protected $fillable = [
        'from_status_id',
        'to_status_id',
    ];

    public function fromStatus(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'from_status_id');
    }

    public function toStatus(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(OrderStatus::class, 'to_status_id');
    }
}
