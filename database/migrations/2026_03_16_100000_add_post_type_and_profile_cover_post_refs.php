<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('post_type', 40)->nullable()->after('shared_post_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('latest_profile_picture_post_id')->nullable()->after('cover_image_visibility')->constrained('posts')->nullOnDelete();
            $table->foreignId('latest_cover_image_post_id')->nullable()->after('latest_profile_picture_post_id')->constrained('posts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['latest_profile_picture_post_id']);
            $table->dropForeign(['latest_cover_image_post_id']);
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('post_type');
        });
    }
};
