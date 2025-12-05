<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SwipeController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PrivacyController;

// Test route - should work without authentication
Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API is working',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// Health check
Route::get('/health', function () {
    try {
        \DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'disconnected';
    }
    
    return response()->json([
        'status' => 'ok',
        'database' => $dbStatus,
        'timestamp' => now()
    ]);
});

// Public Authentication routes (NO MIDDLEWARE)
Route::post('/register', [AuthController::class, 'registerApi']);
Route::post('/login', [AuthController::class, 'loginApi']);

// Protected routes (require JWT authentication)
Route::middleware(['jwt'])->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/profile', [DashboardController::class, 'profile']);
    Route::get('/settings', [DashboardController::class, 'settings']);
    
    // Profile Management
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
    Route::post('/profile/photo/delete', [ProfileController::class, 'deletePhoto']);
    Route::post('/profile/complete', [ProfileController::class, 'completeProfile']);
    Route::post('/profile/quiz', [ProfileController::class, 'submitQuiz']);
    
    // Swipe & Discovery
    Route::post('/swipe', [SwipeController::class, 'swipe']);
    Route::get('/swipes/discover', [SwipeController::class, 'discoverUsers']);
    Route::get('/swipes/history', [SwipeController::class, 'getSwipeHistory']);
    Route::get('/swipes/stats', [SwipeController::class, 'getSwipeStats']);
    Route::delete('/swipes/{swipeId}', [SwipeController::class, 'undoSwipe']);
    
    // Matches
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}', [MatchController::class, 'show']);
    Route::post('/matches/{id}/unmatch', [MatchController::class, 'unmatch']);
    Route::get('/matches/{id}/compatibility', [MatchController::class, 'compatibility']);
    
    // Messages
    Route::post('/matches/{id}/message', [MessageController::class, 'sendMessage']);
    Route::post('/matches/{id}/message/image', [MessageController::class, 'sendImage']);
    Route::get('/matches/{id}/messages', [MessageController::class, 'getMessages']);
    Route::post('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'delete']);
    
    // Privacy & Safety
    Route::post('/privacy/settings', [PrivacyController::class, 'updateSettings']);
    Route::post('/privacy/block/{userId}', [PrivacyController::class, 'blockUser']);
    Route::post('/privacy/unblock/{userId}', [PrivacyController::class, 'unblockUser']);
    Route::get('/privacy/blocked', [PrivacyController::class, 'getBlockedUsers']);
    Route::post('/privacy/report/{userId}', [PrivacyController::class, 'reportUser']);
});