<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttribute extends Model
{
    /** @use HasFactory<\Database\Factories\ProductAttributeFactory> */
    use HasFactory;

    protected $fillable = [
        'product_id',
        'attribute_id',
        'attribute_value_id',
    ];

    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = ['product_id', 'attribute_id', 'attribute_value_id'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
