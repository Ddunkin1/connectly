<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
            $table->text('bio')->nullable()->after('username');
            $table->string('profile_picture')->nullable()->after('bio');
            $table->string('location')->nullable()->after('profile_picture');
            $table->string('website')->nullable()->after('location');
            $table->enum('privacy_settings', ['public', 'private'])->default('public')->after('website');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'bio', 'profile_picture', 'location', 'website', 'privacy_settings']);
        });
    }
};
