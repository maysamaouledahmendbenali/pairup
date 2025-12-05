<?php
// routes/web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SwipeController;

Route::get('/', function () {
    return response()->json([
        'message' => 'Web route working',
        'laravel_version' => app()->version()
    ]);
});

Route::get('/test-api', function () {
    return response()->json([
        'message' => 'Test API working from web routes',
        'timestamp' => now()
    ]);
});
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

// Authentication routes (web views)
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Google OAuth routes
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('google.login');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('google.callback');

// Protected web routes (require authentication)
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [DashboardController::class, 'profile'])->name('profile');
    Route::get('/settings', [DashboardController::class, 'settings'])->name('settings');
    
    // Profile management
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
    Route::post('/profile/photo/delete', [ProfileController::class, 'deletePhoto']);
    Route::post('/profile/complete', [ProfileController::class, 'completeProfile']);
    Route::post('/profile/quiz', [ProfileController::class, 'submitQuiz']);
    
    // Matches
    Route::get('/matches', [MatchController::class, 'index'])->name('matches');
    Route::get('/matches/{id}', [MatchController::class, 'show'])->name('matches.show');
    Route::post('/matches/{id}/unmatch', [MatchController::class, 'unmatch']);
    Route::get('/matches/{id}/compatibility', [MatchController::class, 'compatibility']);
    
    // Messages
    Route::post('/matches/{id}/message', [MessageController::class, 'sendMessage']);
    Route::post('/matches/{id}/message/image', [MessageController::class, 'sendImage']);
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']);
    Route::get('/matches/{id}/messages', [MessageController::class, 'getMessages']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);
    
    // Privacy
    Route::post('/privacy/settings', [PrivacyController::class, 'updateSettings']);
    Route::post('/privacy/block/{userId}', [PrivacyController::class, 'blockUser']);
    Route::post('/privacy/unblock/{userId}', [PrivacyController::class, 'unblockUser']);
    Route::get('/privacy/blocked', [PrivacyController::class, 'getBlockedUsers']);
    Route::post('/privacy/report/{userId}', [PrivacyController::class, 'reportUser']);
    
    // Swiping
    Route::post('/swipe', [SwipeController::class, 'swipe']);
});

// Home page
Route::get('/', function () {
    return view('welcome');
});