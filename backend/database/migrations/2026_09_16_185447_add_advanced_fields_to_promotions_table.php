<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->string('applies_to', 30)->default('all')->after('type')->index();
            $table->boolean('first_order_only')->default(false)->after('max_discount_amount')->index();
            $table->boolean('free_shipping')->default(false)->after('first_order_only');
            $table->unsignedInteger('min_quantity')->nullable()->after('free_shipping');
        });

        Schema::create('promotion_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['promotion_id', 'product_id']);
        });

        Schema::create('promotion_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['promotion_id', 'category_id']);
        });

        Schema::create('promotion_brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['promotion_id', 'brand_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_brands');
        Schema::dropIfExists('promotion_categories');
        Schema::dropIfExists('promotion_products');

        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn([
                'applies_to',
                'first_order_only',
                'free_shipping',
                'min_quantity',
            ]);
        });
    }
};
