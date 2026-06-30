<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RouterTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['subdomain' => 'test', 'status' => true]);

        app()->instance('current_tenant', $this->tenant);
        app()->instance('tenant_id', $this->tenant->id);
    }

    private function headers(): self
    {
        return $this->withHeader('X-Tenant-Domain', 'test');
    }

    public function test_resolves_product_by_slug(): void
    {
        $product = Product::factory()->create([
            'slug' => 'my-product',
            'name' => 'My Product',
        ]);

        $response = $this->headers()->getJson('/api/router/resolve?path=produto/my-product');

        $response->assertOk()
            ->assertJsonPath('type', 'product')
            ->assertJsonPath('data.product.name', 'My Product');
    }

    public function test_resolves_category_by_slug(): void
    {
        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'slug' => 'electronics',
            'name' => 'Electronics',
        ]);

        $response = $this->headers()->getJson('/api/router/resolve?path=electronics');

        $response->assertOk()
            ->assertJsonPath('type', 'category')
            ->assertJsonPath('data.category.name', 'Electronics');
    }

    public function test_resolves_page_by_slug(): void
    {
        Page::create([
            'tenant_id' => $this->tenant->id,
            'title' => 'About Us',
            'slug' => 'about-us',
            'status' => true,
        ]);

        $response = $this->headers()->getJson('/api/router/resolve?path=about-us');

        $response->assertOk()
            ->assertJsonPath('type', 'page')
            ->assertJsonPath('data.page.title', 'About Us');
    }

    public function test_returns_not_found_for_unknown_slug(): void
    {
        $response = $this->headers()->getJson('/api/router/resolve?path=nonexistent-page');

        $response->assertStatus(404)
            ->assertJsonPath('type', 'not_found');
    }

    public function test_resolves_nested_category_slug(): void
    {
        $parent = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Clothing',
            'slug' => 'clothing',
        ]);

        $child = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Shirts',
            'slug' => 'shirts',
            'parent_id' => $parent->id,
        ]);

        $response = $this->headers()->getJson('/api/router/resolve?path=clothing/shirts');

        $response->assertOk()
            ->assertJsonPath('type', 'category')
            ->assertJsonPath('data.category.name', 'Shirts')
            ->assertJsonCount(2, 'data.breadcrumb');
    }

    public function test_404_for_unpublished_resource(): void
    {
        Page::create([
            'tenant_id' => $this->tenant->id,
            'title' => 'Draft Page',
            'slug' => 'draft-page',
            'status' => false,
        ]);

        $response = $this->headers()->getJson('/api/router/resolve?path=draft-page');

        $response->assertStatus(404)
            ->assertJsonPath('type', 'not_found');
    }
}
