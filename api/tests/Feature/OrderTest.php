<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
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

        app()->instance('current_tenant', $this->tenant);
        app()->instance('tenant_id', $this->tenant->id);
    }

    private function authHeaders(): self
    {
        return $this->withHeader('X-Tenant-Domain', 'test')
            ->actingAs($this->user, 'sanctum');
    }

    public function test_can_list_orders(): void
    {
        $status = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Pending', 'slug' => 'pending']);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::insert([
            [
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
                'number' => 'ORD-001',
                'subtotal' => 100.00,
                'total' => 100.00,
                'status_id' => $status->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
                'number' => 'ORD-002',
                'subtotal' => 200.00,
                'total' => 200.00,
                'status_id' => $status->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
                'number' => 'ORD-003',
                'subtotal' => 300.00,
                'total' => 300.00,
                'status_id' => $status->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $response = $this->authHeaders()->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_order(): void
    {
        $status = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Pending', 'slug' => 'pending']);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order = Order::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'number' => 'ORD-1001',
            'subtotal' => 199.90,
            'discount' => 20.00,
            'shipping_cost' => 15.00,
            'total' => 194.90,
            'status_id' => $status->id,
        ]);

        $response = $this->authHeaders()->getJson("/api/orders/{$order->id}");

        $response->assertOk()
            ->assertJsonPath('number', 'ORD-1001')
            ->assertJsonPath('total', '194.90');
    }

    public function test_order_has_sequential_number(): void
    {
        $status = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Pending', 'slug' => 'pending']);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'number' => 'ORD-001',
            'subtotal' => 100.00,
            'total' => 100.00,
            'status_id' => $status->id,
        ]);

        Order::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'number' => 'ORD-002',
            'subtotal' => 200.00,
            'total' => 200.00,
            'status_id' => $status->id,
        ]);

        $response = $this->authHeaders()->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.number', 'ORD-001')
            ->assertJsonPath('data.1.number', 'ORD-002');
    }

    public function test_can_update_order_status(): void
    {
        $pending = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Pending', 'slug' => 'pending']);
        $shipped = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Shipped', 'slug' => 'shipped']);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order = Order::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'number' => 'ORD-100',
            'subtotal' => 150.00,
            'total' => 150.00,
            'status_id' => $pending->id,
        ]);

        $response = $this->authHeaders()->putJson("/api/orders/{$order->id}/status", [
            'status_id' => $shipped->id,
        ]);

        $response->assertOk()
            ->assertJsonPath('status_id', $shipped->id);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status_id' => $shipped->id,
        ]);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $status = OrderStatus::create(['tenant_id' => $this->tenant->id, 'name' => 'Pending', 'slug' => 'pending']);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order = Order::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'number' => 'ORD-200',
            'subtotal' => 100.00,
            'total' => 100.00,
            'status_id' => $status->id,
        ]);

        $response = $this->authHeaders()->putJson("/api/orders/{$order->id}/status", [
            'status_id' => 99999,
        ]);

        $response->assertStatus(422);
    }
}
