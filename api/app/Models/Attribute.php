<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Database\Factories\AttributeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attribute extends Model
{
    /** @use HasFactory<AttributeFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'type',
        'is_filterable',
        'is_variation',
        'position',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'is_filterable' => 'boolean',
            'is_variation' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function values(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }
}
