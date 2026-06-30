<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::factory()->create(['subdomain' => 'tenanta', 'status' => true]);
        $this->tenantB = Tenant::factory()->create(['subdomain' => 'tenantb', 'status' => true]);

        $this->userA = User::factory()->create();
        $this->userA->tenants()->attach($this->tenantA->id);

        $this->userB = User::factory()->create();
        $this->userB->tenants()->attach($this->tenantB->id);
    }

    private function headersFor(Tenant $tenant, User $user): self
    {
        return $this->withHeader('X-Tenant-Domain', $tenant->subdomain)
            ->actingAs($user, 'sanctum');
    }

    public function test_tenant_a_cannot_see_tenant_b_categories(): void
    {
        Category::factory()->create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Category A',
            'slug' => 'category-a',
        ]);

        Category::factory()->create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Category B',
            'slug' => 'category-b',
        ]);

        $responseA = $this->headersFor($this->tenantA, $this->userA)->getJson('/api/categories');

        $responseA->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Category A');

        $responseB = $this->headersFor($this->tenantB, $this->userB)->getJson('/api/categories');

        $responseB->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Category B');
    }

    public function test_tenant_a_cannot_see_tenant_b_products(): void
    {
        $catA = Category::factory()->create(['tenant_id' => $this->tenantA->id]);
        $catB = Category::factory()->create(['tenant_id' => $this->tenantB->id]);
        $brandA = Brand::factory()->create(['tenant_id' => $this->tenantA->id]);
        $brandB = Brand::factory()->create(['tenant_id' => $this->tenantB->id]);

        app()->instance('current_tenant', $this->tenantA);
        app()->instance('tenant_id', $this->tenantA->id);
        Product::factory()->create([
            'name' => 'Product A',
            'brand_id' => $brandA->id,
            'category_id' => $catA->id,
        ]);

        app()->instance('current_tenant', $this->tenantB);
        app()->instance('tenant_id', $this->tenantB->id);
        Product::factory()->create([
            'name' => 'Product B',
            'brand_id' => $brandB->id,
            'category_id' => $catB->id,
        ]);

        $responseA = $this->headersFor($this->tenantA, $this->userA)->getJson('/api/products');

        $responseA->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Product A');

        $responseB = $this->headersFor($this->tenantB, $this->userB)->getJson('/api/products');

        $responseB->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Product B');
    }

    public function test_tenant_a_cannot_see_tenant_b_orders(): void
    {
        $statusA = OrderStatus::create(['tenant_id' => $this->tenantA->id, 'name' => 'Pending', 'slug' => 'pending']);
        $statusB = OrderStatus::create(['tenant_id' => $this->tenantB->id, 'name' => 'Pending', 'slug' => 'pending']);

        $customerA = Customer::factory()->create(['tenant_id' => $this->tenantA->id]);
        $customerB = Customer::factory()->create(['tenant_id' => $this->tenantB->id]);

        Order::create([
            'tenant_id' => $this->tenantA->id,
            'customer_id' => $customerA->id,
            'number' => 'ORD-A1',
            'subtotal' => 100.00,
            'total' => 100.00,
            'status_id' => $statusA->id,
        ]);

        Order::create([
            'tenant_id' => $this->tenantB->id,
            'customer_id' => $customerB->id,
            'number' => 'ORD-B1',
            'subtotal' => 200.00,
            'total' => 200.00,
            'status_id' => $statusB->id,
        ]);

        $responseA = $this->headersFor($this->tenantA, $this->userA)->getJson('/api/orders');

        $responseA->assertOk()
            ->assertJsonCount(1, 'data');

        $responseB = $this->headersFor($this->tenantB, $this->userB)->getJson('/api/orders');

        $responseB->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
