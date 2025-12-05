<?php
// app/Http/Controllers/MatchController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Metch;
use App\Models\User;
use App\Models\Message;
use App\Services\MatchmakingService;
use Illuminate\Support\Facades\Validator;

class MatchController extends Controller
{
    protected $matchmakingService;

    public function __construct(MatchmakingService $matchmakingService)
    {
        $this->matchmakingService = $matchmakingService;
    }

    /**
     * Show all matches
     * GET /api/matches
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $user = auth()->user();
        
        $matches = Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id)
            ->with(['user', 'otherUser'])
            ->latest()
            ->get()
            ->map(function($match) use ($user) {
                $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
                $lastMessage = $match->messages()->latest()->first();
                
                return [
                    'id' => $match->id,
                    'user' => [
                        'id' => $otherUser->id,
                        'full_name' => $otherUser->full_name,
                        'profile_photo_url' => $otherUser->profile_photo_url,
                        'department' => $otherUser->department,
                        'bio' => $otherUser->bio,
                        'last_seen' => $otherUser->last_seen,
                    ],
                    'compatibility_score' => $match->compatibility_score,
                    'matched_at' => $match->matched_at,
                    'last_message' => $lastMessage ? [
                        'id' => $lastMessage->id,
                        'message' => $lastMessage->message,
                        'message_type' => $lastMessage->message_type,
                        'created_at' => $lastMessage->created_at,
                        'is_read' => $lastMessage->is_read,
                    ] : null,
                    'unread_count' => $match->messages()
                        ->where('receiver_id', $user->id)
                        ->where('is_read', false)
                        ->count()
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'matches' => $matches,
                'total' => $matches->count()
            ]
        ]);
    }

    /**
     * Show specific match
     * GET /api/matches/{id}
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $user = auth()->user();
        
        $match = Metch::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('other_user_id', $user->id);
            })
            ->with(['user', 'otherUser'])
            ->firstOrFail();

        $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
        $messages = $match->messages()
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Mark messages as read
        $match->messages()
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'match' => [
                    'id' => $match->id,
                    'compatibility_score' => $match->compatibility_score,
                    'matched_at' => $match->matched_at,
                    'intro_message_sent' => $match->intro_message_sent,
                ],
                'other_user' => [
                    'id' => $otherUser->id,
                    'full_name' => $otherUser->full_name,
                    'profile_photo_url' => $otherUser->profile_photo_url,
                    'department' => $otherUser->department,
                    'bio' => $otherUser->bio,
                    'last_seen' => $otherUser->last_seen,
                    'profile' => $otherUser->profile ? [
                        'skills' => $otherUser->profile->skills,
                        'interests' => $otherUser->profile->interests,
                        'work_style' => $otherUser->profile->work_style,
                        'looking_for' => $otherUser->profile->looking_for,
                        'availability' => $otherUser->profile->availability,
                        'project_types' => $otherUser->profile->project_types,
                    ] : null
                ],
                'messages' => $messages
            ]
        ]);
    }

    /**
     * Unmatch user
     * POST /api/matches/{id}/unmatch
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function unmatch($id)
    {
        $user = auth()->user();
        
        $match = Metch::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('other_user_id', $user->id);
            })
            ->firstOrFail();

        // Delete all messages
        $match->messages()->delete();
        
        // Delete match
        $match->delete();

        // Update user statistics
        $user->statistics()->decrement('total_matches');

        return response()->json([
            'success' => true,
            'message' => 'Match removed successfully'
        ]);
    }

    /**
     * Get compatibility details
     * GET /api/matches/{id}/compatibility
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function compatibility($id)
    {
        $user = auth()->user();
        
        $match = Metch::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('other_user_id', $user->id);
            })
            ->with(['user.profile', 'otherUser.profile'])
            ->firstOrFail();

        $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
        
        // Calculate detailed compatibility
        $compatibilityDetails = $this->calculateDetailedCompatibility($user, $otherUser, $match);

        return response()->json([
            'success' => true,
            'data' => [
                'match_id' => $match->id,
                'overall_score' => $match->compatibility_score,
                'compatibility_details' => $compatibilityDetails,
                'insights' => $this->matchmakingService->getCompatibilityInsights($user, $otherUser)
            ]
        ]);
    }

    /**
     * Get match statistics
     * GET /api/matches/stats
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats()
    {
        $user = auth()->user();
        
        $totalMatches = Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id)
            ->count();

        $activeMatches = Metch::where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('other_user_id', $user->id);
            })
            ->whereHas('messages', function($query) {
                $query->where('created_at', '>=', now()->subDays(7));
            })
            ->count();

        $averageCompatibility = Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id)
            ->avg('compatibility_score');

        $topMatches = Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id)
            ->with(['user', 'otherUser'])
            ->orderBy('compatibility_score', 'desc')
            ->limit(5)
            ->get()
            ->map(function($match) use ($user) {
                $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
                return [
                    'id' => $match->id,
                    'user' => [
                        'id' => $otherUser->id,
                        'full_name' => $otherUser->full_name,
                        'profile_photo_url' => $otherUser->profile_photo_url,
                    ],
                    'compatibility_score' => $match->compatibility_score,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_matches' => $totalMatches,
                'active_matches' => $activeMatches,
                'average_compatibility' => round($averageCompatibility ?? 0, 2),
                'top_matches' => $topMatches
            ]
        ]);
    }

    /**
     * Search matches
     * GET /api/matches/search
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $user = auth()->user();
        
        $validator = Validator::make($request->all(), [
            'query' => 'sometimes|string|max:255',
            'min_compatibility' => 'sometimes|numeric|min:0|max:100',
            'department' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $query = Metch::where('user_id', $user->id)
            ->orWhere('other_user_id', $user->id);

        // Filter by search query (name)
        if ($request->has('query')) {
            $searchQuery = $request->query;
            $query->where(function($q) use ($user, $searchQuery) {
                $q->whereHas('user', function($subQ) use ($user, $searchQuery) {
                    $subQ->where('id', '!=', $user->id)
                         ->where('full_name', 'like', "%{$searchQuery}%");
                })->orWhereHas('otherUser', function($subQ) use ($user, $searchQuery) {
                    $subQ->where('id', '!=', $user->id)
                         ->where('full_name', 'like', "%{$searchQuery}%");
                });
            });
        }

        // Filter by minimum compatibility
        if ($request->has('min_compatibility')) {
            $query->where('compatibility_score', '>=', $request->min_compatibility);
        }

        // Filter by department
        if ($request->has('department')) {
            $department = $request->department;
            $query->where(function($q) use ($user, $department) {
                $q->whereHas('user', function($subQ) use ($user, $department) {
                    $subQ->where('id', '!=', $user->id)
                         ->where('department', $department);
                })->orWhereHas('otherUser', function($subQ) use ($user, $department) {
                    $subQ->where('id', '!=', $user->id)
                         ->where('department', $department);
                });
            });
        }

        $matches = $query->with(['user', 'otherUser'])
            ->latest()
            ->paginate(20)
            ->through(function($match) use ($user) {
                $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
                return [
                    'id' => $match->id,
                    'user' => [
                        'id' => $otherUser->id,
                        'full_name' => $otherUser->full_name,
                        'profile_photo_url' => $otherUser->profile_photo_url,
                        'department' => $otherUser->department,
                    ],
                    'compatibility_score' => $match->compatibility_score,
                    'matched_at' => $match->matched_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $matches
        ]);
    }

    /**
     * Calculate detailed compatibility breakdown
     *
     * @param User $user1
     * @param User $user2
     * @param Metch $match
     * @return array
     */
    private function calculateDetailedCompatibility(User $user1, User $user2, Metch $match): array
    {
        $profile1 = $user1->profile;
        $profile2 = $user2->profile;

        $commonSkills = $profile1 && $profile2 
            ? array_intersect($profile1->skills ?? [], $profile2->skills ?? []) 
            : [];
        
        $commonInterests = $profile1 && $profile2 
            ? array_intersect($profile1->interests ?? [], $profile2->interests ?? []) 
            : [];

        $workStyleScore = 0;
        if ($profile1 && $profile2 && $profile1->work_style && $profile2->work_style) {
            $workStyleScore = $this->calculateWorkStyleCompatibility(
                $profile1->work_style,
                $profile2->work_style
            );
        }

        return [
            'skills' => [
                'score' => $this->calculateArrayMatchScore(
                    $profile1->skills ?? [], 
                    $profile2->skills ?? []
                ),
                'common_skills' => array_values($commonSkills),
                'total_common' => count($commonSkills),
            ],
            'interests' => [
                'score' => $this->calculateArrayMatchScore(
                    $profile1->interests ?? [], 
                    $profile2->interests ?? []
                ),
                'common_interests' => array_values($commonInterests),
                'total_common' => count($commonInterests),
            ],
            'work_style' => [
                'score' => round($workStyleScore, 2),
                'description' => $this->getWorkStyleDescription($workStyleScore),
            ],
            'goals' => [
                'user1_looking_for' => $profile1->looking_for ?? 'Not specified',
                'user2_looking_for' => $profile2->looking_for ?? 'Not specified',
                'aligned' => $this->areGoalsAligned(
                    $profile1->looking_for ?? '', 
                    $profile2->looking_for ?? ''
                ),
            ],
        ];
    }

    /**
     * Calculate array match score
     *
     * @param array $array1
     * @param array $array2
     * @return float
     */
    private function calculateArrayMatchScore(array $array1, array $array2): float
    {
        if (empty($array1) || empty($array2)) {
            return 0;
        }

        $common = array_intersect($array1, $array2);
        $total = array_unique(array_merge($array1, $array2));
        
        return round((count($common) / count($total)) * 100, 2);
    }

    /**
     * Calculate work style compatibility
     *
     * @param array $style1
     * @param array $style2
     * @return float
     */
    private function calculateWorkStyleCompatibility(array $style1, array $style2): float
    {
        $total = 0;
        $count = 0;
        
        foreach ($style1 as $key => $value1) {
            if (isset($style2[$key])) {
                $value2 = $style2[$key];
                $difference = abs($value1 - $value2);
                $similarity = 1 - ($difference / 5); // Assuming 1-5 scale
                $total += max(0, $similarity);
                $count++;
            }
        }
        
        return $count > 0 ? ($total / $count) * 100 : 0;
    }

    /**
     * Get work style description
     *
     * @param float $score
     * @return string
     */
    private function getWorkStyleDescription(float $score): string
    {
        if ($score >= 80) {
            return 'Excellent work style match';
        } elseif ($score >= 60) {
            return 'Good work style compatibility';
        } elseif ($score >= 40) {
            return 'Moderate work style alignment';
        } else {
            return 'Different work styles - may require adaptation';
        }
    }

    /**
     * Check if goals are aligned
     *
     * @param string $goal1
     * @param string $goal2
     * @return bool
     */
    private function areGoalsAligned(string $goal1, string $goal2): bool
    {
        if (empty($goal1) || empty($goal2)) {
            return false;
        }

        similar_text(strtolower($goal1), strtolower($goal2), $percent);
        return $percent >= 50;
    }
}