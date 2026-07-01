<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'parent_id', 'title', 'slug', 'position', 'active', 'open_new_tab',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'open_new_tab' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'parent_id');
    }

    public function children(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id')->orderBy('position');
    }

    public function allChildren(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id');
    }

    /** Build nested tree from flat collection */
    public static function toTree($items, $parentId = null): array
    {
        return $items
            ->where('parent_id', $parentId)
            ->sortBy('position')
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'position' => $item->position,
                'active' => $item->active,
                'open_new_tab' => $item->open_new_tab,
                'children' => self::toTree($items, $item->id),
            ])
            ->all();
    }
}
