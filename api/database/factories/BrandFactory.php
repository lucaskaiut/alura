<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BrandFactory extends Factory
{
    protected $model = Brand::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'tenant_id' => 1,
            'name' => $name,
            'slug' => Str::slug($name),
            'logo_path' => null,
            'description' => fake()->optional()->sentence(),
            'status' => true,
        ];
    }
}
