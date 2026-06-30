<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('medias')) {
            Schema::create('medias', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->string('original_name');
                $table->string('stored_name');
                $table->string('mime_type');
                $table->string('extension', 20);
                $table->unsignedBigInteger('size');
                $table->string('path');
                $table->string('url')->nullable();
                $table->string('status')->default('active');
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index('tenant_id');
                $table->index('status');
                $table->index('mime_type');
            });
        }

        if (!Schema::hasTable('media_references')) {
            Schema::create('media_references', function (Blueprint $table) {
                $table->id();
                $table->foreignId('media_id')->constrained('medias')->cascadeOnDelete();
                $table->morphs('referable');
                $table->string('collection')->default('default');
                $table->integer('rank')->default(0);
                $table->boolean('is_primary')->default(false);
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index('collection');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media_references');
        Schema::dropIfExists('medias');
    }
};
