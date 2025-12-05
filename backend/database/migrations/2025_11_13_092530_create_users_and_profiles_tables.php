<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create users table first - USE BIGINT
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // Use bigint instead of uuid
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->string('full_name');
            $table->string('profile_photo_url')->nullable();
            $table->string('department', 100)->nullable();
            $table->text('bio')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->string('google_id')->unique()->nullable();
            $table->enum('auth_provider', ['email', 'google'])->default('email');
            $table->boolean('profile_completed')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Then create user_profiles table - USE BIGINT
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id(); // Use bigint instead of uuid
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->json('skills')->nullable();
            $table->json('interests')->nullable();
            $table->json('work_style')->nullable();
            $table->string('looking_for')->nullable();
            $table->string('availability', 100)->nullable();
            $table->json('project_types')->nullable();
            $table->boolean('workstyle_quiz_completed')->default(false);
            $table->json('workstyle_results')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('users');
    }
};