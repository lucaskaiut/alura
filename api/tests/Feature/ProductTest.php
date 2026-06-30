<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Category $category;
    private Brand $brand;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['subdomain' => 'test', 'status' => true]);
        $this->user = User::factory()->create();
        $this->user->tenants()->attach($this->tenant->id);

        app()->instance('current_tenant', $this->tenant);
        app()->instance('tenant_id', $this->tenant->id);

        $this->category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->brand = Brand::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    private function authHeaders(): self
    {
        return $this->withHeader('X-Tenant-Domain', 'test')
            ->actingAs($this->user, 'sanctum');
    }

    public function test_can_list_products(): void
    {
        Product::factory()->count(3)->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->authHeaders()->getJson('/api/products');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_simple_product(): void
    {
        $response = $this->authHeaders()->postJson('/api/products', [
            'name' => 'Simple Product',
            'slug' => 'simple-product',
            'sku' => 'SKU-001',
            'price' => 29.90,
            'cost_price' => 15.00,
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'is_variable' => false,
            'status' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Simple Product')
            ->assertJsonPath('sku', 'SKU-001')
            ->assertJsonPath('price', '29.90')
            ->assertJsonPath('is_variable', false)
            ->assertJsonPath('tenant_id', $this->tenant->id);

        $this->assertDatabaseHas('products', [
            'name' => 'Simple Product',
            'slug' => 'simple-product',
        ]);
    }

    public function test_can_create_variable_product_with_variants(): void
    {
        $response = $this->authHeaders()->postJson('/api/products', [
            'name' => 'Variable Product',
            'slug' => 'variable-product',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
            'is_variable' => true,
            'status' => true,
            'variants' => [
                [
                    'sku' => 'VAR-RED',
                    'price' => 39.90,
                    'weight' => 0.5,
                    'rank' => 1,
                ],
                [
                    'sku' => 'VAR-BLUE',
                    'price' => 44.90,
                    'weight' => 0.5,
                    'rank' => 2,
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('is_variable', true)
            ->assertJsonCount(2, 'variants')
            ->assertJsonPath('variants.0.sku', 'VAR-RED')
            ->assertJsonPath('variants.1.sku', 'VAR-BLUE');
    }

    public function test_can_update_product(): void
    {
        $product = Product::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->authHeaders()->putJson("/api/products/{$product->id}", [
            'name' => 'Updated Product',
            'slug' => 'updated-product',
            'price' => 99.90,
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Updated Product')
            ->assertJsonPath('price', '99.90');
    }

    public function test_can_delete_product(): void
    {
        $product = Product::factory()->create([
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->authHeaders()->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_slug_is_unique_per_tenant(): void
    {
        $tenantB = Tenant::factory()->create(['subdomain' => 'tenantb', 'status' => true]);

        Product::factory()->create([
            'slug' => 'same-slug',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
        ]);

        // Slug must be unique within the SAME tenant - expect validation error
        $response = $this->authHeaders()->postJson('/api/products', [
            'name' => 'Same Slug Product',
            'slug' => 'same-slug',
            'brand_id' => $this->brand->id,
            'category_id' => $this->category->id,
        ]);

        $response->assertStatus(422);

        // But same slug is allowed in a DIFFERENT tenant
        $userB = User::factory()->create();
        $userB->tenants()->attach($tenantB->id);

        $responseB = $this->withHeader('X-Tenant-Domain', 'tenantb')
            ->actingAs($userB, 'sanctum')
            ->getJson('/api/products');

        $responseB->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
