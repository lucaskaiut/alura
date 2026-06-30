<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_successful(): void
    {
        $tenant = Tenant::factory()->create(['subdomain' => 'demo', 'status' => true]);
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'status' => true,
        ]);
        $user->tenants()->attach($tenant->id);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['user', 'token', 'tenants'])
            ->assertJsonCount(1, 'tenants')
            ->assertJsonPath('tenants.0.id', $tenant->id);
    }

    public function test_login_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_returns_multiple_tenants(): void
    {
        $tenantA = Tenant::factory()->create(['subdomain' => 'tenanta', 'status' => true]);
        $tenantB = Tenant::factory()->create(['subdomain' => 'tenantb', 'status' => true]);
        $user = User::factory()->create([
            'email' => 'multi@example.com',
            'password' => Hash::make('password'),
            'status' => true,
        ]);
        $user->tenants()->attach([$tenantA->id, $tenantB->id]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'multi@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonCount(2, 'tenants');
    }

    public function test_login_inactive_user(): void
    {
        User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => Hash::make('password'),
            'status' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(422);
    }

    public function test_me_endpoint_with_tenant(): void
    {
        $tenant = Tenant::factory()->create(['subdomain' => 'demo', 'status' => true]);
        $user = User::factory()->create(['status' => true]);
        $user->tenants()->attach($tenant->id);

        $response = $this->withHeader('X-Tenant-Id', $tenant->id)
            ->actingAs($user, 'sanctum')
            ->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('tenant_id', $tenant->id)
            ->assertJsonPath('tenants.0.id', $tenant->id);
    }

    public function test_login_user_without_tenants(): void
    {
        User::factory()->create([
            'email' => 'noteams@example.com',
            'password' => Hash::make('password'),
            'status' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'noteams@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonCount(0, 'tenants');
    }
}
