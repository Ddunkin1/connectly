<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL/MariaDB, use ALTER TABLE directly
        // This avoids needing doctrine/dbal package
        DB::statement('ALTER TABLE posts MODIFY content TEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set existing NULL values to empty string before making NOT NULL
        DB::statement('UPDATE posts SET content = "" WHERE content IS NULL');
        DB::statement('ALTER TABLE posts MODIFY content TEXT NOT NULL');
    }
};
