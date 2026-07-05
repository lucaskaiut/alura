<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DesignSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DesignSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $design = DesignSetting::getForTenant();
        return response()->json($design);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.colors' => 'required|array',
            'settings.colors.*' => ['required', 'string', 'regex:/^#[a-fA-F0-9]{6}$/'],
        ]);

        $design = DesignSetting::getForTenant();
        $design->update(['settings' => $validated['settings']]);

        return response()->json($design);
    }

    public function reset(): JsonResponse
    {
        $design = DesignSetting::getForTenant();
        $design->update(['settings' => DesignSetting::defaultSettings()]);

        return response()->json($design);
    }

    /** Public endpoint for the storefront */
    public function storefront(): JsonResponse
    {
        if (!tenant()) {
            return response()->json(['settings' => DesignSetting::defaultSettings()]);
        }

        $design = DesignSetting::getForTenant();
        return response()->json(['settings' => $design->settings]);
    }
}
