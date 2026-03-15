<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->onDelete('cascade');
            $table->foreignId('invited_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('inviter_id')->constrained('users')->onDelete('cascade');
            $table->string('status', 32)->default('pending'); // pending, pending_approval, accepted, rejected
            $table->timestamps();

            $table->unique(['community_id', 'invited_user_id']);
            $table->index(['community_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_invites');
    }
};
