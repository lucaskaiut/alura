<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
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

    public function test_can_list_categories(): void
    {
        Category::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_category(): void
    {
        $response = $this->authHeaders()->postJson('/api/categories', [
            'name' => 'Electronics',
            'slug' => 'electronics',
            'description' => 'Electronic devices',
            'status' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Electronics')
            ->assertJsonPath('slug', 'electronics')
            ->assertJsonPath('tenant_id', $this->tenant->id);

        $this->assertDatabaseHas('categories', [
            'name' => 'Electronics',
            'slug' => 'electronics',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_can_update_category(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->putJson("/api/categories/{$category->id}", [
            'name' => 'Updated Category',
            'slug' => 'updated-category',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Category')
            ->assertJsonPath('slug', 'updated-category');
    }

    public function test_can_delete_category(): void
    {
        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->authHeaders()->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_slug_is_unique_per_tenant(): void
    {
        $tenantB = Tenant::factory()->create(['subdomain' => 'tenantb', 'status' => true]);

        Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'slug' => 'electronics',
        ]);

        // Same slug in same tenant is rejected
        $response = $this->authHeaders()->postJson('/api/categories', [
            'name' => 'Electronics',
            'slug' => 'electronics',
        ]);

        $response->assertStatus(422);

        // Same slug in a different tenant is allowed
        $userB = User::factory()->create();
        $userB->tenants()->attach($tenantB->id);

        $responseB = $this->withHeader('X-Tenant-Domain', 'tenantb')
            ->actingAs($userB, 'sanctum')
            ->postJson('/api/categories', [
                'name' => 'Electronics',
                'slug' => 'electronics',
            ]);

        $responseB->assertStatus(201);

        $responseC = $this->withHeader('X-Tenant-Domain', 'tenantb')
            ->actingAs($userB, 'sanctum')
            ->getJson('/api/categories');

        $responseC->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_parent_child_relationship(): void
    {
        $parent = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Parent',
            'slug' => 'parent',
        ]);

        $response = $this->authHeaders()->postJson('/api/categories', [
            'name' => 'Child',
            'slug' => 'child',
            'parent_id' => $parent->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('parent_id', $parent->id);

        $child = Category::find($response->json('id'));

        $this->assertEquals($parent->id, $child->parent_id);

        $showResponse = $this->authHeaders()->getJson("/api/categories/{$parent->id}");

        $showResponse->assertOk()
            ->assertJsonCount(1, 'children');
    }
}
