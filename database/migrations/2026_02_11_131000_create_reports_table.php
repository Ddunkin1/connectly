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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->morphs('reportable'); // reportable_type, reportable_id
            $table->string('reason'); // spam, harassment, hate_speech, violence, inappropriate, other
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, reviewed, dismissed, action_taken
            $table->timestamps();

            // Prevent duplicate reports from same user for same reportable
            $table->unique(['reporter_id', 'reportable_type', 'reportable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
