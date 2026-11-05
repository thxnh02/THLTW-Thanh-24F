<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('post_topics', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 150)->unique();
            $table->timestamps();
        });
        Schema::table('posts', function (Blueprint $table): void {
            $table->foreignId('topic_id')->nullable()->constrained('post_topics')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', fn (Blueprint $table) => $table->dropConstrainedForeignId('topic_id'));
        Schema::dropIfExists('post_topics');
    }
};
