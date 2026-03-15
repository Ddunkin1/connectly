<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->string('media_url', 500)->nullable()->after('content');
            $table->string('media_type', 20)->nullable()->after('media_url');
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['media_url', 'media_type']);
        });
    }
};
