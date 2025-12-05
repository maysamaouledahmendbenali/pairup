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
        Schema::create('user_statistics', function (Blueprint $table) {
            $table->id(); // Change from uuid() to id() - uses bigint
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Change from foreignUuid()
            $table->integer('total_likes_given')->default(0);
            $table->integer('total_likes_received')->default(0);
            $table->integer('total_matches')->default(0);
            $table->integer('total_messages_sent')->default(0);
            $table->integer('profile_views')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_statistics');
    }
};