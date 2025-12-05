<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Swipe;
use App\Models\Metch;
use App\Services\MatchmakingService;
use App\Services\NotificationService;
use App\Services\UserService;

class SwipeController extends Controller
{
    protected $matchmakingService;
    protected $notificationService;
    protected $userService;

    public function __construct(
        MatchmakingService $matchmakingService,
        NotificationService $notificationService,
        UserService $userService
    ) {
        $this->matchmakingService = $matchmakingService;
        $this->notificationService = $notificationService;
        $this->userService = $userService;
    }

    /**
     * Process a swipe action
     * POST /api/swipe
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function swipe(Request $request)
    {
        $user = auth()->user();

        // Validate the request
        $validator = Validator::make($request->all(), [
            'swiped_id' => 'required|integer|exists:users,id',
            'action' => 'required|in:like,pass,superlike'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prevent self-swiping
        if ($user->id === $request->swiped_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot swipe on yourself'
            ], 422);
        }

        // Check if already swiped
        $existingSwipe = Swipe::where('swiper_id', $user->id)
            ->where('swiped_id', $request->swiped_id)
            ->first();

        if ($existingSwipe) {
            return response()->json([
                'success' => false,
                'message' => 'You have already swiped on this user'
            ], 422);
        }

        // Get the user being swiped
        $swipedUser = User::findOrFail($request->swiped_id);

        // Check if user is blocked or has blocked
        if ($user->hasBlocked($swipedUser) || $user->isBlockedBy($swipedUser)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot interact with this user'
            ], 403);
        }

        // Create the swipe record
        $swipe = Swipe::create([
            'swiper_id' => $user->id,
            'swiped_id' => $request->swiped_id,
            'action' => $request->action
        ]);

        // Update statistics based on action
        switch ($request->action) {
            case 'like':
            case 'superlike':
                $this->userService->updateUserStatistics($user, 'like_given');
                $this->userService->updateUserStatistics($swipedUser, 'like_received');
                
                // Send like notification
                $this->notificationService->sendLikeNotification($user, $swipedUser, $request->action);
                break;
            
            case 'pass':
                $this->userService->updateUserStatistics($user, 'pass_given');
                break;
        }

        // Check for match if action is positive
        $matchData = null;
        if ($request->action === 'like' || $request->action === 'superlike') {
            $hasMatch = $this->matchmakingService->checkForMatch($user, $swipedUser);

            if ($hasMatch) {
                $compatibilityScore = $this->matchmakingService->calculateCompatibility($user, $swipedUser);
                
                // Create match record
                $match = Metch::create([
                    'user_id' => min($user->id, $request->swiped_id),
                    'other_user_id' => max($user->id, $request->swiped_id),
                    'compatibility_score' => $compatibilityScore,
                    'matched_at' => now()
                ]);

                // Update statistics for both users
                $this->userService->updateUserStatistics($user, 'match_created');
                $this->userService->updateUserStatistics($swipedUser, 'match_created');

                // Send match notification to both users
                $this->notificationService->sendMatchNotification($match, $user);
                $this->notificationService->sendMatchNotification($match, $swipedUser);

                $matchData = [
                    'match_id' => $match->id,
                    'compatibility_score' => $compatibilityScore,
                    'matched_user' => $swipedUser->makeHidden(['email', 'last_seen'])
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Swipe recorded successfully',
            'data' => [
                'swipe_id' => $swipe->id,
                'action' => $swipe->action,
                'swiped_user' => $swipedUser->makeHidden(['email', 'last_seen']),
                'match' => $matchData ? true : false,
                'match_details' => $matchData
            ]
        ]);
    }

    /**
     * Get swipe history for the authenticated user
     * GET /api/swipes/history
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSwipeHistory(Request $request)
    {
        $user = auth()->user();
        
        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:given,received',
            'action' => 'sometimes|in:like,pass,superlike',
            'limit' => 'sometimes|integer|min:1|max:100',
            'offset' => 'sometimes|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $type = $request->get('type', 'given');
        $action = $request->get('action');
        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);

        $query = $type === 'given' 
            ? $user->swipesGiven()->with('swiped')
            : $user->swipesReceived()->with('swiper');

        if ($action) {
            $query->where('action', $action);
        }

        $swipes = $query->latest()
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->map(function ($swipe) use ($type) {
                $relatedUser = $type === 'given' ? $swipe->swiped : $swipe->swiper;
                return [
                    'id' => $swipe->id,
                    'action' => $swipe->action,
                    'created_at' => $swipe->created_at,
                    'user' => $relatedUser->makeHidden(['email', 'last_seen'])
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'swipes' => $swipes,
                'total' => $query->count(),
                'type' => $type,
                'filters' => [
                    'action' => $action
                ]
            ]
        ]);
    }

    /**
     * Get swipe statistics for the authenticated user
     * GET /api/swipes/stats
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSwipeStats()
    {
        $user = auth()->user();
        $stats = $this->userService->getUserStatistics($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Undo a swipe (only allowed within 24 hours)
     * DELETE /api/swipes/{swipeId}
     *
     * @param string $swipeId
     * @return \Illuminate\Http\JsonResponse
     */
    public function undoSwipe($swipeId)
    {
        $user = auth()->user();

        $swipe = Swipe::where('id', $swipeId)
            ->where('swiper_id', $user->id)
            ->where('created_at', '>', now()->subHours(24))
            ->firstOrFail();

        // Check if this swipe resulted in a match
        $match = Metch::where(function($query) use ($user, $swipe) {
            $query->where('user_id', $user->id)
                  ->where('other_user_id', $swipe->swiped_id);
        })->orWhere(function($query) use ($user, $swipe) {
            $query->where('user_id', $swipe->swiped_id)
                  ->where('other_user_id', $user->id);
        })->first();

        if ($match) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot undo swipe that resulted in a match'
            ], 422);
        }

        // Delete the swipe
        $swipe->delete();

        if ($swipe->action === 'like' || $swipe->action === 'superlike') {
            $this->userService->decrementUserStatistics($user, 'like_given');
            $swipedUser = User::find($swipe->swiped_id);
            if ($swipedUser) {
                $this->userService->decrementUserStatistics($swipedUser, 'like_received');
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Swipe undone successfully'
        ]);
    }

    /**
     * Get users available to swipe (excluding already swiped, blocked, and matched users)
     * GET /api/swipes/discover
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function discoverUsers(Request $request)
    {
        $user = auth()->user();
        
        $validator = Validator::make($request->all(), [
            'limit' => 'sometimes|integer|min:1|max:50',
            'filters' => 'sometimes|array',
            'filters.department' => 'sometimes|string',
            'filters.skills' => 'sometimes|array',
            'filters.availability' => 'sometimes|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $limit = $request->get('limit', 10);
        $filters = $request->get('filters', []);

        // Get IDs of users already swiped, blocked, or matched
        $swipedUserIds = $user->swipesGiven()->pluck('swiped_id');
        $blockedUserIds = $user->blockedUsers()->pluck('blocked_id');
        $blockedByUserIds = $user->blockedBy()->pluck('blocker_id');
        $matchUserIds = $user->matches()->pluck('user_id')->merge($user->matches()->pluck('other_user_id'));

        $excludeIds = $swipedUserIds
            ->merge($blockedUserIds)
            ->merge($blockedByUserIds)
            ->merge($matchUserIds)
            ->push($user->id)
            ->unique();

        $query = User::whereNotIn('id', $excludeIds)
            ->where('is_active', true)
            ->where('profile_completed', true)
            ->with('profile');

        // Apply filters
        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (!empty($filters['skills'])) {
            $query->whereHas('profile', function($q) use ($filters) {
                $q->whereJsonContains('skills', $filters['skills']);
            });
        }

        if (!empty($filters['availability'])) {
            $query->whereHas('profile', function($q) use ($filters) {
                $q->where('availability', $filters['availability']);
            });
        }

        $users = $query->inRandomOrder()
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'profile_photo_url' => $user->profile_photo_url,
                    'department' => $user->department,
                    'bio' => $user->bio,
                    'profile' => $user->profile ? [
                        'skills' => $user->profile->skills ?? [],
                        'interests' => $user->profile->interests ?? [],
                        'availability' => $user->profile->availability,
                        'looking_for' => $user->profile->looking_for
                    ] : null
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'total_available' => $query->count(),
                'filters_applied' => $filters
            ]
        ]);
    }
}
