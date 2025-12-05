<?php
// app/Services/MatchmakingService.php
namespace App\Services;

use App\Models\User;
use App\Models\Swipe;
use App\Models\BlockedUser;
use Illuminate\Support\Facades\Cache;

class MatchmakingService
{
    /**
     * Calculate compatibility score between two users
     */
    public function calculateCompatibility(User $user1, User $user2): float
    {
        $cacheKey = "compatibility_{$user1->id}_{$user2->id}";
        
        return Cache::remember($cacheKey, 3600, function() use ($user1, $user2) {
            $score = 0;
            $totalWeight = 0;
            
            // Skills matching (40% weight)
            if ($user1->profile->skills && $user2->profile->skills) {
                $skillMatch = $this->calculateArrayOverlap(
                    $user1->profile->skills, 
                    $user2->profile->skills
                );
                $score += $skillMatch * 0.4;
                $totalWeight += 0.4;
            }
            
            // Interests matching (30% weight)
            if ($user1->profile->interests && $user2->profile->interests) {
                $interestMatch = $this->calculateArrayOverlap(
                    $user1->profile->interests, 
                    $user2->profile->interests
                );
                $score += $interestMatch * 0.3;
                $totalWeight += 0.3;
            }
            
            // Work style compatibility (30% weight)
            if ($user1->profile->work_style && $user2->profile->work_style) {
                $workStyleMatch = $this->calculateWorkStyleCompatibility(
                    $user1->profile->work_style, 
                    $user2->profile->work_style
                );
                $score += $workStyleMatch * 0.3;
                $totalWeight += 0.3;
            }
            
            return $totalWeight > 0 ? round(($score / $totalWeight) * 100, 2) : 0;
        });
    }

    /**
     * Get swipe feed for a user
     */
    public function getSwipeFeed(User $user, int $limit = 20)
    {
        $cacheKey = "swipe_feed_{$user->id}";
        
        return Cache::remember($cacheKey, 300, function() use ($user, $limit) {
            return User::where('id', '!=', $user->id)
                ->whereNotIn('id', function($query) use ($user) {
                    $query->select('swiped_id')
                          ->from('swipes')
                          ->where('swiper_id', $user->id);
                })
                ->whereNotIn('id', function($query) use ($user) {
                    $query->select('blocked_id')
                          ->from('blocked_users')
                          ->where('blocker_id', $user->id);
                })
                ->where('profile_completed', true)
                ->where('is_active', true)
                ->with('profile')
                ->inRandomOrder()
                ->limit($limit)
                ->get()
                ->map(function($potentialMatch) use ($user) {
                    $potentialMatch->compatibility_score = $this->calculateCompatibility($user, $potentialMatch);
                    return $potentialMatch;
                })
                ->sortByDesc('compatibility_score')
                ->values();
        });
    }

    /**
     * Check if two users have a mutual match
     */
    public function checkForMatch(User $user1, User $user2): bool
    {
        $mutualLike = Swipe::where('swiper_id', $user2->id)
            ->where('swiped_id', $user1->id)
            ->where('action', 'like')
            ->exists();

        $user1Like = Swipe::where('swiper_id', $user1->id)
            ->where('swiped_id', $user2->id)
            ->where('action', 'like')
            ->exists();

        return $mutualLike && $user1Like;
    }

    /**
     * Get compatibility insights for two users
     */
    public function getCompatibilityInsights(User $user1, User $user2): array
    {
        $insights = [];
        
        // Skills overlap insights
        $commonSkills = array_intersect(
            $user1->profile->skills ?? [],
            $user2->profile->skills ?? []
        );
        
        if (!empty($commonSkills)) {
            $insights[] = [
                'type' => 'skills',
                'message' => "You both share skills in: " . implode(', ', array_slice($commonSkills, 0, 3)),
                'strength' => 'high'
            ];
        }

        // Interests overlap insights
        $commonInterests = array_intersect(
            $user1->profile->interests ?? [],
            $user2->profile->interests ?? []
        );
        
        if (!empty($commonInterests)) {
            $insights[] = [
                'type' => 'interests',
                'message' => "You share interests in: " . implode(', ', array_slice($commonInterests, 0, 3)),
                'strength' => 'medium'
            ];
        }

        // Work style insights
        if ($user1->profile->workstyle_results && $user2->profile->workstyle_results) {
            $workStyleAnalysis = $this->analyzeWorkStyle(
                $user1->profile->workstyle_results,
                $user2->profile->workstyle_results
            );
            
            if ($workStyleAnalysis['communication_style'] > 0.7) {
                $insights[] = [
                    'type' => 'work_style',
                    'message' => "Great communication style match!",
                    'strength' => 'high'
                ];
            }
            
            if ($workStyleAnalysis['work_rhythm'] > 0.7) {
                $insights[] = [
                    'type' => 'work_style',
                    'message' => "Similar work rhythms and productivity patterns",
                    'strength' => 'medium'
                ];
            }
        }

        return $insights;
    }

    /**
     * Analyze work style compatibility
     */
    public function analyzeWorkStyle(array $user1Quiz, array $user2Quiz): array
    {
        $analysis = [
            'communication_style' => $this->compareQuizAnswers($user1Quiz, $user2Quiz, 'communication'),
            'work_rhythm' => $this->compareQuizAnswers($user1Quiz, $user2Quiz, 'rhythm'),
            'conflict_resolution' => $this->compareQuizAnswers($user1Quiz, $user2Quiz, 'conflict'),
            'leadership_style' => $this->compareQuizAnswers($user1Quiz, $user2Quiz, 'leadership'),
        ];
        
        $analysis['overall_score'] = array_sum($analysis) / count($analysis);
        
        return $analysis;
    }

    /**
     * Calculate array overlap percentage
     */
    private function calculateArrayOverlap(array $array1, array $array2): float
    {
        $common = array_intersect($array1, $array2);
        $total = array_unique(array_merge($array1, $array2));
        
        return count($total) > 0 ? count($common) / count($total) : 0;
    }

    /**
     * Calculate work style compatibility
     */
    private function calculateWorkStyleCompatibility(array $style1, array $style2): float
    {
        $total = 0;
        $count = 0;
        
        foreach ($style1 as $key => $value1) {
            if (isset($style2[$key])) {
                $value2 = $style2[$key];
                $difference = abs($value1 - $value2);
                $maxDifference = 5;
                $similarity = 1 - ($difference / $maxDifference);
                $total += max(0, $similarity);
                $count++;
            }
        }
        
        return $count > 0 ? $total / $count : 0;
    }

    /**
     * Compare specific quiz answers
     */
    private function compareQuizAnswers(array $quiz1, array $quiz2, string $category): float
    {
        $score = 0;
        $count = 0;
        
        foreach ($quiz1 as $key => $value1) {
            if (str_contains($key, $category) && isset($quiz2[$key])) {
                $value2 = $quiz2[$key];
                $difference = abs($value1 - $value2);
                $maxDifference = 5;
                $similarity = 1 - ($difference / $maxDifference);
                $score += $similarity;
                $count++;
            }
        }
        
        return $count > 0 ? $score / $count : 0;
    }
}