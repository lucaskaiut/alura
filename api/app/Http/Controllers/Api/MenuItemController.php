<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = MenuItem::orderBy('position')->get();

        return response()->json(MenuItem::toTree($items));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:500',
            'parent_id' => 'nullable|exists:menu_items,id',
            'position' => 'integer|min:0',
            'active' => 'boolean',
            'open_new_tab' => 'boolean',
        ]);

        $item = MenuItem::create($validated);

        return response()->json($item->load('children'), 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:500',
            'parent_id' => 'nullable|exists:menu_items,id',
            'position' => 'integer|min:0',
            'active' => 'boolean',
            'open_new_tab' => 'boolean',
        ]);

        // Prevent circular reference
        if (isset($validated['parent_id']) && $validated['parent_id']) {
            $ancestorIds = $this->getAncestorIds($validated['parent_id']);
            if (in_array($menuItem->id, $ancestorIds)) {
                return response()->json(['message' => 'Cannot set a descendant as parent.'], 422);
            }
        }

        $menuItem->update($validated);

        return response()->json($menuItem->load('children'));
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete(); // cascade deletes children via FK

        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $items = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:menu_items,id',
            'items.*.parent_id' => 'nullable|exists:menu_items,id',
            'items.*.position' => 'required|integer|min:0',
        ])['items'];

        foreach ($items as $item) {
            MenuItem::where('id', $item['id'])->update([
                'parent_id' => $item['parent_id'] ?? null,
                'position' => $item['position'],
            ]);
        }

        return response()->json(['message' => 'Reordered']);
    }

    private function getAncestorIds(int $parentId): array
    {
        $ids = [];
        $current = MenuItem::find($parentId);
        while ($current) {
            $ids[] = $current->id;
            $current = $current->parent;
        }
        return $ids;
    }
}
