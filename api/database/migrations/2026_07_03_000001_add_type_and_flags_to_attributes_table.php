<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->string('type')->default('select')->after('slug');
            $table->boolean('is_filterable')->default(false)->after('type');
            $table->boolean('is_variation')->default(false)->after('is_filterable');
        });
    }

    public function down(): void
    {
        Schema::table('attributes', function (Blueprint $table) {
            $table->dropColumn(['type', 'is_filterable', 'is_variation']);
        });
    }
};
