<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use BelongsToTenant;

    protected $table = 'medias';

    protected $fillable = [
        'tenant_id',
        'original_name',
        'stored_name',
        'mime_type',
        'extension',
        'size',
        'path',
        'url',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'metadata' => 'json',
        ];
    }

    public function references()
    {
        return $this->hasMany(MediaReference::class);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    public function publicUrl(): string
    {
        if ($this->url) {
            return $this->url;
        }

        return url('storage/' . $this->path);
    }
}
