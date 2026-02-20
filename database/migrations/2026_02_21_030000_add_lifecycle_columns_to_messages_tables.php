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
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('read_at');
            $table->foreignId('deleted_by')->nullable()->after('edited_at')->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::table('group_messages', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('attachment_type');
            $table->foreignId('deleted_by')->nullable()->after('edited_at')->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('group_messages', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropColumn(['edited_at', 'deleted_by', 'deleted_at']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropColumn(['edited_at', 'deleted_by', 'deleted_at']);
        });
    }
};
