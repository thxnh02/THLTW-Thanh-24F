<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('product_reviews', fn (Blueprint $table) => $table->boolean('is_visible')->default(true)->index());
        Schema::table('site_settings', fn (Blueprint $table) => $table->unsignedBigInteger('shipping_fee_vnd')->nullable());
        Schema::table('coupons', function (Blueprint $table): void {
            $table->unsignedInteger('per_customer_limit')->nullable();
            $table->string('scope', 12)->default('all');
        });
        Schema::table('orders', fn (Blueprint $table) => $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete());
        Schema::create('coupon_products', function (Blueprint $table): void {
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['coupon_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_products');
        Schema::table('orders', fn (Blueprint $table) => $table->dropConstrainedForeignId('coupon_id'));
        Schema::table('coupons', fn (Blueprint $table) => $table->dropColumn(['per_customer_limit', 'scope']));
        Schema::table('site_settings', fn (Blueprint $table) => $table->dropColumn('shipping_fee_vnd'));
        Schema::table('product_reviews', function (Blueprint $table): void {
            $table->dropIndex(['is_visible']);
            $table->dropColumn('is_visible');
        });
    }
};
