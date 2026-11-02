<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 30);
            $table->string('recipient_name', 150);
            $table->string('recipient_phone', 16);
            $table->string('province', 100);
            $table->string('province_code', 20)->nullable();
            $table->string('ward', 100);
            $table->string('ward_code', 20)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('street', 200);
            $table->string('detail', 200)->nullable();
            $table->string('delivery_note', 500)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_default', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_addresses');
    }
};
