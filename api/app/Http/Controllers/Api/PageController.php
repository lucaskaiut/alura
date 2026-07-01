<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PageController extends Controller
{
    private function revalidateSite(string $slug): void
    {
        $siteUrl = config('app.site_url', 'http://localhost:3000');
        $token = env('REVALIDATE_TOKEN', 'njord-revalidate-secret');
        try {
            Http::withHeaders(['x-revalidate-token' => $token])
                ->post("{$siteUrl}/api/revalidate", ['path' => "/{$slug}"]);
        } catch (\Throwable) {
            // Silently fail — revalidation is optional
        }
    }
    public function index(): JsonResponse
    {
        $pages = Page::paginate(20);

        return response()->json($pages);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'is_home' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();

        $page = Page::create($validated);

        $this->revalidateSite($page->slug);

        return response()->json($page, 201);
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json($page);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:255',
            'status' => 'boolean',
            'is_home' => 'boolean',
        ]);

        $page->update($validated);

        $this->revalidateSite($page->slug);

        return response()->json($page);
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return response()->json(null, 204);
    }
}
