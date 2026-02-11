<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('group_conversation_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // admin, member
            $table->timestamps();

            $table->unique(['group_conversation_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_conversation_members');
        Schema::dropIfExists('group_conversations');
    }
};
