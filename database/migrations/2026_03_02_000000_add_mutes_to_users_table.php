<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('muted_topics')->nullable()->after('notification_preferences');
            $table->json('muted_users')->nullable()->after('muted_topics');
            $table->json('muted_communities')->nullable()->after('muted_users');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['muted_topics', 'muted_users', 'muted_communities']);
        });
    }
};

