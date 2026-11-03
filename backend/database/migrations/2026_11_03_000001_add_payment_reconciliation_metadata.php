<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->boolean('payment_review_required')->default(false)->index());
        Schema::table('payment_attempts', function (Blueprint $table): void {
            // Legacy attempts remain NULL: their original pay URL timestamp cannot be reconstructed safely.
            $table->timestamp('pay_created_at')->nullable();
            $table->timestamp('pay_expires_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->string('review_reason', 120)->nullable();
        });
        Schema::create('payment_reconciliation_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 24);
            $table->string('outcome', 32);
            $table->string('reason', 120);
            $table->timestamp('created_at');
            $table->index(['order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_reconciliation_events');
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['payment_review_required']);
            $table->dropColumn('payment_review_required');
        });
        Schema::table('payment_attempts', fn (Blueprint $table) => $table->dropColumn([
            'pay_created_at', 'pay_expires_at', 'last_checked_at', 'review_reason',
        ]));
    }
};
