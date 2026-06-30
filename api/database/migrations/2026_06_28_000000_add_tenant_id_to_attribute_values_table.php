<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attribute_values', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
        });

        DB::table('attribute_values')
            ->join('attributes', 'attribute_values.attribute_id', '=', 'attributes.id')
            ->whereNotNull('attributes.tenant_id')
            ->update(['attribute_values.tenant_id' => DB::raw('attributes.tenant_id')]);
    }

    public function down(): void
    {
        Schema::table('attribute_values', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });
    }
};
