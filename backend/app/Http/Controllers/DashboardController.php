<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Metch;
use App\Models\Message;
use App\Models\Swipe;
use App\Models\Notification;

class DashboardController extends Controller
{
    /**
     * Show dashboard
     * GET /dashboard
     */
 public function index()
{
    $user = auth()->user();
    
    $stats = [
        'total_matches' => Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id)
            ->count(),
        'total_likes' => Swipe::where('swiped_id', $user->id)
            ->whereIn('action', ['like', 'superlike'])
            ->count(),
        'unread_messages' => Message::where('receiver_id', $user->id)
            ->where('is_read', false)
            ->count(),
        'unread_notifications' => Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count(),
    ];

    $recentMatches = Metch::where('user_id', $user->id)
        ->orWhere('other_user_id', $user->id)
        ->with(['user', 'otherUser'])
        ->latest()
        ->take(5)
        ->get()
        ->map(function($match) use ($user) {
            $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
            return [
                'id' => $match->id,
                'user' => $otherUser,
                'matched_at' => $match->matched_at,
                'compatibility_score' => $match->compatibility_score
            ];
        });

    return response()->json([
        'success' => true,
        'data' => [
            'stats' => $stats,
            'recent_matches' => $recentMatches
        ]
    ]);
}
    /**
     * Show user profile
     * GET /profile
     */
    public function profile()
    {
        $user = auth()->user()->load(['profile', 'privacySettings', 'statistics']);
        return view('dashboard.profile', compact('user'));
    }

    /**
     * Show settings
     * GET /settings
     */
    public function settings()
    {
        $user = auth()->user()->load('privacySettings');
        return view('dashboard.settings', compact('user'));
    }
}
