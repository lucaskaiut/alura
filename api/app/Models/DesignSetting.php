<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class DesignSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'settings'];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    public static function defaultSettings(): array
    {
        return [
            'colors' => [
                'primary' => '#ffa6de',
                'primary_hover' => '#e57fc0',
                'secondary' => '#8e3a6e',
                'accent' => '#c45b9c',
                'bg_main' => '#ffffff',
                'bg_secondary' => '#f8fafc',
                'text_main' => '#111827',
                'text_secondary' => '#6b7280',
                'btn_primary_bg' => '#ffa6de',
                'btn_primary_text' => '#4a1028',
                'btn_secondary_bg' => '#f3f4f6',
                'btn_secondary_text' => '#111827',
                'link' => '#c45b9c',
                'link_hover' => '#8e3a6e',
                'border' => '#e5e7eb',
                'success' => '#10b981',
                'warning' => '#f59e0b',
                'danger' => '#ef4444',
            ],
        ];
    }

    public static function getForTenant(): self
    {
        return static::firstOrCreate(
            ['tenant_id' => tenant_id()],
            ['settings' => static::defaultSettings()]
        );
    }
}
