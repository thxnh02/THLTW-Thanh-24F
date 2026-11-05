<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('type', 10);
            $table->unsignedBigInteger('value');
            $table->unsignedBigInteger('minimum_vnd')->default(0);
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('coupon_code', 40)->nullable();
            $table->unsignedBigInteger('discount_vnd')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn(['coupon_code', 'discount_vnd']));
        Schema::dropIfExists('coupons');
    }
};
