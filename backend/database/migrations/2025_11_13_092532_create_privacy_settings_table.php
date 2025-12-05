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
        Schema::create('privacy_settings', function (Blueprint $table) {
            $table->id(); // Change from uuid() to id() - uses bigint
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Change from foreignUuid()
            
            $table->enum('profile_visibility', ['public', 'friends', 'private'])->default('public');
            $table->boolean('show_online_status')->default(true);
            $table->enum('allow_messages_from', ['everyone', 'matches', 'none'])->default('matches');
            $table->boolean('data_sharing')->default(false);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('privacy_settings');
    }
};