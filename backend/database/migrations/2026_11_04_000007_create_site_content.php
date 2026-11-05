<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('site_content', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 15);
            $table->string('title', 180);
            $table->string('slug', 200);
            $table->text('body')->nullable();
            $table->string('href', 255)->nullable();
            $table->string('image', 500)->nullable();
            $table->boolean('active')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['type', 'slug']);
            $table->index(['type', 'active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_content');
    }
};
