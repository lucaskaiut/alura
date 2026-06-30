<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaReference extends Model
{
    protected $fillable = [
        'media_id',
        'referable_type',
        'referable_id',
        'collection',
        'rank',
        'is_primary',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'rank' => 'integer',
            'is_primary' => 'boolean',
            'metadata' => 'json',
        ];
    }

    public function media()
    {
        return $this->belongsTo(Media::class);
    }

    public function referable()
    {
        return $this->morphTo();
    }
}
