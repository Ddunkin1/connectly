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
        Schema::table('posts', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('visibility');
        });

        DB::statement("ALTER TABLE posts MODIFY COLUMN visibility ENUM('public', 'followers', 'private') DEFAULT 'public'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('is_archived');
        });

        DB::statement("ALTER TABLE posts MODIFY COLUMN visibility ENUM('public', 'followers') DEFAULT 'public'");
    }
};
