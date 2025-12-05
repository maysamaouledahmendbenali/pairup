<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\MatchmakingService;
use App\Services\NotificationService;
use App\Services\ChatService;
use App\Services\UserService;
use App\Services\CompatibilityService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MatchmakingService::class, function ($app) {
            return new MatchmakingService();
        });

        $this->app->singleton(NotificationService::class, function ($app) {
            return new NotificationService();
        });

        $this->app->singleton(ChatService::class, function ($app) {
            return new ChatService();
        });

        $this->app->singleton(UserService::class, function ($app) {
            return new UserService();
        });

        $this->app->singleton(CompatibilityService::class, function ($app) {
            return new CompatibilityService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // This method is for general bootstrapping, not for defining routes.
    }
}