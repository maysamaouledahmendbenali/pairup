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
        Schema::create('reports', function (Blueprint $table) {
            $table->id(); // Change from uuid() to id() - uses bigint
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->foreignId('reported_id')->constrained('users')->onDelete('cascade'); // Change from foreignUuid()
            $table->enum('reason', ['spam', 'harassment', 'fake', 'inappropriate', 'other']);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'resolved'])->default('pending');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users'); // Change from foreignUuid()
            $table->timestamps();
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