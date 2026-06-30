<?php

namespace Database\Factories;

use App\Models\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AttributeFactory extends Factory
{
    protected $model = Attribute::class;

    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'tenant_id' => 1,
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'status' => true,
        ];
    }
}
