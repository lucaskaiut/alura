<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'title',
        'slug',
        'content',
        'meta_title',
        'meta_description',
        'status',
        'is_home',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'is_home' => 'boolean',
        ];
    }

    public function creator(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
