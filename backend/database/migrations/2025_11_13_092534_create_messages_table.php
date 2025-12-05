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
        Schema::create('messages', function (Blueprint $table) {
            $table->id(); // Change from uuid() to id() - uses bigint
            $table->foreignId('match_id')->constrained()->onDelete('cascade'); // Change from foreignUuid()
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->text('message')->nullable();
            $table->string('message_type')->default('text'); // text, image, emoji
            $table->string('image_url')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['match_id', 'created_at']);
            $table->index('sender_id');
            $table->index('receiver_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};