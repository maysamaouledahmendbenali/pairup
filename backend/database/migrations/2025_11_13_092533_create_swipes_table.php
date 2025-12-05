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
        Schema::create('swipes', function (Blueprint $table) {
            $table->id(); // Change from uuid() to id() - uses bigint
            $table->foreignId('swiper_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->foreignId('swiped_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->enum('action', ['like', 'pass', 'superlike'])->default('like');
            $table->timestamp('created_at')->useCurrent();
            
            $table->unique(['swiper_id', 'swiped_id']);
            $table->index(['swiper_id', 'action']);
            $table->index('swiped_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('swipes');
    }
};