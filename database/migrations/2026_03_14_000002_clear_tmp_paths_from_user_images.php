<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Clear profile_picture and cover_image when they contain PHP tmp paths
     * (corrupted by failed Supabase uploads that persisted UploadedFile as string).
     */
    public function up(): void
    {
        DB::table('users')
            ->where(function ($q) {
                $q->where('profile_picture', 'like', '%/tmp/%')
                    ->orWhere('profile_picture', 'like', '%\\tmp\\%');
            })
            ->update(['profile_picture' => null]);

        DB::table('users')
            ->where(function ($q) {
                $q->where('cover_image', 'like', '%/tmp/%')
                    ->orWhere('cover_image', 'like', '%\\tmp\\%');
            })
            ->update(['cover_image' => null]);
    }

    /**
     * Reverse the migrations.
     * Cannot restore corrupted tmp paths; no-op.
     */
    public function down(): void
    {
        // No-op: we do not restore invalid tmp paths
    }
};
