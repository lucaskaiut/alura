<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaService
{
    public function upload(UploadedFile $file, string $collection = 'default'): Media
    {
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $extension = $file->getClientOriginalExtension();
        $size = $file->getSize();

        $storedName = uniqid() . '_' . time() . '.' . $extension;
        $path = $file->storeAs('media', $storedName, 'public');

        return Media::create([
            'original_name' => $originalName,
            'stored_name' => $storedName,
            'mime_type' => $mimeType,
            'extension' => $extension,
            'size' => $size,
            'path' => $path,
            'status' => 'active',
            'metadata' => [
                'uploaded_via' => 'service',
                'collection' => $collection,
            ],
        ]);
    }

    public function deleteIfOrphan(Media $media): bool
    {
        if ($media->references()->count() > 0) {
            return false;
        }

        Storage::disk('public')->delete($media->path);
        $media->delete();

        return true;
    }
}
