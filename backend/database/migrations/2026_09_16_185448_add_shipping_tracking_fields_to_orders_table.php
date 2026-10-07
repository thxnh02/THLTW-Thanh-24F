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
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('shipping_method_id')->nullable()->after('shipping_address')->constrained('shipping_methods')->nullOnDelete();
            $table->string('shipping_method_name')->nullable()->after('shipping_method_id');
            $table->string('shipping_carrier')->nullable()->after('promotion_code');
            $table->string('tracking_code')->nullable()->after('shipping_carrier');
            $table->timestamp('shipped_at')->nullable()->after('tracking_code');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shipping_method_id');
            $table->dropColumn([
                'shipping_method_name',
                'shipping_carrier',
                'tracking_code',
                'shipped_at',
                'delivered_at',
            ]);
        });
    }
};
