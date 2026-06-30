<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'permissions',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
        ];
    }

    public function hasPermission(string $module, string $action = 'read'): bool
    {
        $permissions = $this->permissions ?? [];
        return isset($permissions[$module]) && in_array($action, $permissions[$module]);
    }
}
