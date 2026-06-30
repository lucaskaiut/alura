<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaReference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Media::where('status', 'active');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('original_name', 'like', "%{$search}%");
        }

        if ($request->filled('type')) {
            $type = $request->input('type');
            $query->where('mime_type', 'like', "{$type}/%");
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $medias = $query->latest()->paginate($request->input('per_page', 24));

        return response()->json($medias);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'collection' => 'nullable|string|max:50',
        ], [
            'file.max' => 'A imagem deve ter no máximo 5 MB.',
            'file.image' => 'O arquivo deve ser uma imagem.',
            'file.mimes' => 'Formatos aceitos: JPEG, PNG, WebP.',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $extension = $file->getClientOriginalExtension();
        $size = $file->getSize();

        $storedName = uniqid() . '_' . time() . '.' . $extension;
        $path = $file->storeAs('media', $storedName, 'public');

        $media = Media::create([
            'original_name' => $originalName,
            'stored_name' => $storedName,
            'mime_type' => $mimeType,
            'extension' => $extension,
            'size' => $size,
            'path' => $path,
            'status' => 'active',
            'metadata' => [
                'uploaded_via' => 'api',
                'collection' => $request->input('collection', 'default'),
            ],
        ]);

        return response()->json($media, 201);
    }

    public function show(Media $medium): JsonResponse
    {
        $medium->load('references.referable');

        $usage = $medium->references->groupBy('referable_type')->map(function ($refs) {
            return [
                'type' => $refs->first()->referable_type,
                'count' => $refs->count(),
                'items' => $refs->take(5)->map(function ($ref) {
                    $referable = $ref->referable;
                    return [
                        'id' => $ref->referable_id,
                        'name' => $referable?->name ?? $referable?->title ?? '—',
                        'collection' => $ref->collection,
                    ];
                }),
            ];
        })->values();

        return response()->json([
            'media' => $medium,
            'usage' => $usage,
        ]);
    }

    public function serve(Media $medium)
    {
        if (!tenant()) {
            return response()->json(['message' => 'File not found'], 404);
        }

        if (!$medium->path || !Storage::disk('public')->exists($medium->path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->file(
            Storage::disk('public')->path($medium->path),
            ['Content-Type' => $medium->mime_type]
        );
    }

    public function destroy(Request $request, Media $medium): JsonResponse
    {
        $usageCount = $medium->references()->count();

        if ($usageCount > 0 && !$request->input('force')) {
            $references = $medium->references()->with('referable')->get()->map(function ($ref) {
                return [
                    'type' => class_basename($ref->referable_type),
                    'id' => $ref->referable_id,
                    'collection' => $ref->collection,
                ];
            });

            return response()->json([
                'message' => 'Esta mídia está em uso.',
                'usage_count' => $usageCount,
                'references' => $references,
            ], 409);
        }

        $medium->references()->delete();
        Storage::disk('public')->delete($medium->path);
        $medium->delete();

        return response()->json(null, 204);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer'])['ids'];
        $deleted = 0;
        $blocked = 0;

        foreach ($ids as $id) {
            $media = Media::find($id);
            if (!$media) continue;

            if ($media->references()->count() > 0) {
                $blocked++;
                continue;
            }

            Storage::disk('public')->delete($media->path);
            $media->references()->delete();
            $media->delete();
            $deleted++;
        }

        return response()->json(['deleted' => $deleted, 'blocked' => $blocked]);
    }
}
