<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->unsignedInteger('stock_quantity')->nullable(); // NULL: inventory is not tracked.
        });
        Schema::create('cart_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('quantity');
            $table->unsignedBigInteger('unit_price_at_add_vnd')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->uuid('order_code')->nullable()->unique();
            $table->json('shipping_snapshot')->nullable();
            $table->unsignedBigInteger('subtotal_vnd')->nullable();
            $table->unsignedBigInteger('shipping_fee_vnd')->default(0);
            $table->unsignedBigInteger('grand_total_vnd')->nullable();
            $table->string('payment_method', 20)->nullable();
            $table->string('payment_status', 24)->nullable();
            $table->string('idempotency_key', 80)->nullable();
            $table->text('customer_note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('stock_restored_at')->nullable();
            $table->unique(['user_id', 'idempotency_key']);
        });
        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name', 180);
            $table->string('product_slug', 200);
            $table->string('product_image')->nullable();
            $table->unsignedBigInteger('unit_price_vnd');
            $table->unsignedTinyInteger('quantity');
            $table->unsignedBigInteger('line_total_vnd');
            $table->timestamps();
        });
        Schema::create('payment_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 20);
            $table->string('txn_ref', 80)->unique();
            $table->unsignedBigInteger('amount_vnd');
            $table->string('state', 24)->default('pending');
            $table->string('provider_transaction_id', 100)->nullable();
            $table->string('response_code', 10)->nullable();
            $table->string('transaction_status', 10)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('customer_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_key', 100)->unique();
            $table->string('title', 180);
            $table->string('message', 500);
            $table->string('link', 200)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->string('email_status', 16)->nullable();
            $table->timestamp('email_attempted_at')->nullable();
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notifications');
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('order_items');
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'idempotency_key']);
            $table->dropColumn(['order_code', 'shipping_snapshot', 'subtotal_vnd', 'shipping_fee_vnd', 'grand_total_vnd', 'payment_method', 'payment_status', 'idempotency_key', 'customer_note', 'paid_at', 'stock_restored_at']);
        });
        Schema::dropIfExists('cart_items');
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('stock_quantity'));
    }
};
