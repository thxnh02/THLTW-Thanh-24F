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
        Schema::create('return_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('reason', 120)->nullable();
            $table->text('condition_note')->nullable();
            $table->timestamps();
            $table->unique(['return_request_id', 'order_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_request_items');
    }
};
