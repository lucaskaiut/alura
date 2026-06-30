<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('gateway');
            $table->string('service_code')->nullable();
            $table->decimal('free_from', 12, 2)->nullable();
            $table->decimal('min_value', 12, 2)->nullable();
            $table->decimal('max_weight', 10, 3)->nullable();
            $table->json('zip_ranges')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_rules');
    }
};
