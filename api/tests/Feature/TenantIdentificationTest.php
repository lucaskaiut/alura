<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIdentificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_identify_tenant_by_header(): void
    {
        $tenant = Tenant::factory()->create([
            'subdomain' => 'demo',
            'domain' => 'demo.localhost',
            'status' => true,
        ]);

        $response = $this->withHeader('X-Tenant-Domain', 'demo')
            ->getJson('/api/ping');

        $response->assertOk()
            ->assertJsonPath('tenant_id', $tenant->id)
            ->assertJsonPath('tenant', $tenant->name);
    }

    public function test_unknown_tenant_returns_404(): void
    {
        $response = $this->withHeader('X-Tenant-Domain', 'nonexistent')
            ->getJson('/api/ping');

        $response->assertNotFound();
    }

    public function test_inactive_tenant_returns_404(): void
    {
        $tenant = Tenant::factory()->create([
            'subdomain' => 'inactive',
            'status' => false,
        ]);

        $response = $this->withHeader('X-Tenant-Domain', 'inactive')
            ->getJson('/api/ping');

        $response->assertNotFound();
    }
}
