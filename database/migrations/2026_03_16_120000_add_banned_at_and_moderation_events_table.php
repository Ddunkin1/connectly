<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Runs before 2026_03_22_* (suspended_until) — anchor after suspended_at, which exists from 2026_02_11_*.
        if (! Schema::hasColumn('users', 'banned_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('banned_at')->nullable()->after('suspended_at');
            });
        }

        if (! Schema::hasTable('moderation_events')) {
            Schema::create('moderation_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action', 32); // warning, suspend, ban, unban
                $table->string('reason_code', 64)->nullable();
                $table->text('message')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_events');

        if (Schema::hasColumn('users', 'banned_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('banned_at');
            });
        }
    }
};
