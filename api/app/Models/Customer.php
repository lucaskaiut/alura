<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use BelongsToTenant;
    use HasApiTokens;

    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'document',
        'email',
        'phone',
        'password',
        'status',
        'birth_date',
        'accepts_marketing',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'accepts_marketing' => 'boolean',
            'password' => 'hashed',
            'status' => 'boolean',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }
}
