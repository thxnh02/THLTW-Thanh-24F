<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('sku', 60)->nullable()->unique();
            $table->unsignedInteger('quantity')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->string('short_description', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropUnique(['sku']);
            $table->dropColumn(['sku', 'quantity', 'is_featured', 'short_description']);
        });
    }
};
