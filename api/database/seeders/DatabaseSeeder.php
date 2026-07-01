<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Idempotent: only seed if no data exists yet
        if (Tenant::count() > 0) {
            $this->command->info('Database already seeded — skipping.');
            return;
        }

        $tenant = Tenant::create([
            'name' => 'Loja Demo',
            'slug' => 'loja-demo',
            'subdomain' => 'demo',
            'email' => 'admin@demo.com',
            'trade_name' => 'Loja Demo',
        ]);

        $adminRole = Role::create([
            'tenant_id' => $tenant->id,
            'name' => 'Administrador',
            'permissions' => [
                'tenants' => ['read', 'write'],
                'users' => ['read', 'write'],
                'products' => ['read', 'write'],
                'categories' => ['read', 'write'],
                'brands' => ['read', 'write'],
                'orders' => ['read', 'write'],
                'customers' => ['read', 'write'],
                'stock' => ['read', 'write'],
                'reports' => ['read'],
                'settings' => ['read', 'write'],
            ],
        ]);

        $user = User::create([
            'name' => 'Admin Demo',
            'email' => 'admin@alura.com',
            'password' => Hash::make('password'),
            'status' => true,
        ]);

        $user->tenants()->attach($tenant->id, ['role_id' => $adminRole->id]);
    }
}
