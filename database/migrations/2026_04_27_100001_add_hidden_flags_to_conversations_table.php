<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->boolean('hidden_by_user_one')->default(false)->after('last_message_at');
            $table->boolean('hidden_by_user_two')->default(false)->after('hidden_by_user_one');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['hidden_by_user_one', 'hidden_by_user_two']);
        });
    }
};
