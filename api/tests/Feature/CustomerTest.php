<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
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

    public function test_can_list_customers(): void
    {
        Customer::factory()->count(3)->create();

        $response = $this->authHeaders()->getJson('/api/customers');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_can_create_customer(): void
    {
        $response = $this->authHeaders()->postJson('/api/customers', [
            'name' => 'John Doe',
            'document' => '12345678901',
            'email' => 'john@example.com',
            'phone' => '555-0100',
            'birth_date' => '1990-01-15',
            'accepts_marketing' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'John Doe')
            ->assertJsonPath('email', 'john@example.com')
            ->assertJsonPath('tenant_id', $this->tenant->id);

        $this->assertDatabaseHas('customers', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_can_create_customer_with_address(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->authHeaders()->postJson("/api/customers/{$customer->id}/addresses", [
            'type' => 'shipping',
            'street' => '123 Main St',
            'number' => '100',
            'complement' => 'Apt 4B',
            'neighborhood' => 'Downtown',
            'city' => 'Metropolis',
            'state' => 'NY',
            'zip_code' => '10001',
            'is_default' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('street', '123 Main St')
            ->assertJsonPath('city', 'Metropolis')
            ->assertJsonPath('is_default', true);

        $showResponse = $this->authHeaders()->getJson("/api/customers/{$customer->id}");

        $showResponse->assertOk()
            ->assertJsonCount(1, 'addresses');
    }

    public function test_can_search_customers(): void
    {
        Customer::factory()->create([
            'name' => 'Alice Johnson',
            'email' => 'alice@example.com',
        ]);

        Customer::factory()->create([
            'name' => 'Bob Smith',
            'email' => 'bob@example.com',
        ]);

        Customer::factory()->create([
            'name' => 'Charlie Brown',
            'email' => 'charlie@example.com',
        ]);

        $response = $this->authHeaders()->getJson('/api/customers?search=alice');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alice Johnson');

        $responseNoMatch = $this->authHeaders()->getJson('/api/customers?search=zzz');

        $responseNoMatch->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
