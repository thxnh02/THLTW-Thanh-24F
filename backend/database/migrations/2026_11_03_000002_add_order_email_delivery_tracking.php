<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_notifications', function (Blueprint $table): void {
            $table->unsignedTinyInteger('email_attempt_count')->default(0);
            $table->string('admin_email_status', 16)->nullable();
            $table->timestamp('admin_email_attempted_at')->nullable();
            $table->unsignedTinyInteger('admin_email_attempt_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('customer_notifications', function (Blueprint $table): void {
            $table->dropColumn(['email_attempt_count', 'admin_email_status', 'admin_email_attempted_at', 'admin_email_attempt_count']);
        });
    }
};
