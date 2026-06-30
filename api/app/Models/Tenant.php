<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'subdomain',
        'domain',
        'legal_name',
        'trade_name',
        'fiscal_document',
        'email',
        'phone',
        'address_street',
        'address_number',
        'address_complement',
        'address_neighborhood',
        'address_city',
        'address_state',
        'address_zip',
        'logo_path',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function settings()
    {
        return $this->hasMany(TenantSetting::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withPivot('role_id')
            ->withTimestamps();
    }
}
