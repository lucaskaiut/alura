<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Database\Factories\AttributeValueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttributeValue extends Model
{
    /** @use HasFactory<AttributeValueFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'attribute_id',
        'tenant_id',
        'value',
        'slug',
    ];

    public function attribute(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }
}
