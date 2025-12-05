<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('other_user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('compatibility_score', 5, 2)->default(0); // 0-100
            $table->boolean('intro_message_sent')->default(false);
            $table->timestamp('matched_at')->useCurrent();
            $table->timestamps();
            
            // Fix the index - use the correct column names
            $table->unique(['user_id', 'other_user_id']);
            $table->index('user_id');
            $table->index('other_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};