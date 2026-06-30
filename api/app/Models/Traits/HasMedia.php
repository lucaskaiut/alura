<?php

namespace App\Models\Traits;

use App\Models\Media;
use App\Models\MediaReference;

trait HasMedia
{
    public function mediaReferences()
    {
        return $this->morphMany(MediaReference::class, 'referable');
    }

    public function media()
    {
        return $this->morphToMany(Media::class, 'referable', 'media_references')
            ->withPivot(['collection', 'rank', 'is_primary', 'metadata'])
            ->orderByPivot('rank', 'asc');
    }

    public function attachMedia(int $mediaId, string $collection = 'default', array $pivot = []): MediaReference
    {
        return $this->mediaReferences()->create(array_merge([
            'media_id' => $mediaId,
            'collection' => $collection,
        ], $pivot));
    }

    public function syncMedia(array $mediaIds, string $collection = 'default'): void
    {
        $this->mediaReferences()->where('collection', $collection)->delete();

        foreach ($mediaIds as $i => $id) {
            $this->attachMedia($id, $collection, [
                'rank' => $i,
                'is_primary' => $i === 0,
            ]);
        }
    }

    public function getPrimaryMedia(string $collection = 'default'): ?Media
    {
        return $this->media()
            ->wherePivot('collection', $collection)
            ->wherePivot('is_primary', true)
            ->first();
    }
}
