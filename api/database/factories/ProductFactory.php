<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'short_desc' => fake()->sentence(),
            'full_desc' => fake()->paragraph(),
            'sku' => strtoupper(Str::random(8)),
            'barcode' => fake()->ean13(),
            'price' => fake()->randomFloat(2, 1, 1000),
            'cost_price' => fake()->randomFloat(2, 0.5, 500),
            'weight' => fake()->randomFloat(3, 0.01, 50),
            'height' => fake()->randomFloat(2, 1, 200),
            'width' => fake()->randomFloat(2, 1, 200),
            'length' => fake()->randomFloat(2, 1, 200),
            'is_variable' => false,
            'status' => true,
        ];
    }

    public function variable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_variable' => true,
            'price' => null,
            'sku' => null,
            'barcode' => null,
            'weight' => null,
        ]);
    }
}
