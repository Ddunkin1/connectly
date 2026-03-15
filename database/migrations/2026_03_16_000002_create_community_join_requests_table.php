<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_join_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('status', 20)->default('pending'); // pending, approved, rejected
            $table->timestamps();

            $table->unique(['community_id', 'user_id']);
            $table->index(['community_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_join_requests');
    }
};
