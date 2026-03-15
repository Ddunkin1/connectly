<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_comments', function (Blueprint $table) {
            $table->foreignId('parent_comment_id')->nullable()->after('author_id')->constrained('profile_comments')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('profile_comments', function (Blueprint $table) {
            $table->dropForeign(['parent_comment_id']);
        });
    }
};
