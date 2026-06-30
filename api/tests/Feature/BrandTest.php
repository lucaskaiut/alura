<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['subdomain' => 'test', 'status' => true]);
        $this->user = User::factory()->create();
        $this->user->tenants()->attach($this->tenant->id);
    }

    private function authHeaders(): self
    {
        return $this->withHeader('X-Tenant-Domain', 'test')
            ->actingAs($this->user, 'sanctum');
    }

    public function test_can_list_brands(): void
    {
        Brand::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->getJson('/api/brands');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_brand(): void
    {
        $response = $this->authHeaders()->postJson('/api/brands', [
            'name' => 'Acme Corporation',
            'slug' => 'acme-corporation',
            'description' => 'A trusted brand',
            'status' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Acme Corporation')
            ->assertJsonPath('slug', 'acme-corporation')
            ->assertJsonPath('tenant_id', $this->tenant->id);

        $this->assertDatabaseHas('brands', [
            'name' => 'Acme Corporation',
            'slug' => 'acme-corporation',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_can_update_brand(): void
    {
        $brand = Brand::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->putJson("/api/brands/{$brand->id}", [
            'name' => 'Updated Brand',
            'slug' => 'updated-brand',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Brand')
            ->assertJsonPath('slug', 'updated-brand');
    }

    public function test_can_delete_brand(): void
    {
        $brand = Brand::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->deleteJson("/api/brands/{$brand->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }
}
