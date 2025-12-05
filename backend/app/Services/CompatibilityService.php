<?php
// app/Services/CompatibilityService.php
namespace App\Services;

use App\Models\User;
use App\Services\MatchmakingService; // Fixed: Added missing import

class CompatibilityService
{
    /**
     * Calculate detailed compatibility analysis
     */
    public function getDetailedCompatibility(User $user1, User $user2): array
    {
        $compatibilityScore = app(MatchmakingService::class)->calculateCompatibility($user1, $user2);
        
        $breakdown = [
            'skills' => $this->calculateSkillsCompatibility($user1, $user2),
            'interests' => $this->calculateInterestsCompatibility($user1, $user2),
            'work_style' => $this->calculateWorkStyleCompatibility($user1, $user2),
            'goals' => $this->calculateGoalsCompatibility($user1, $user2),
        ];

        $insights = $this->generateCompatibilityInsights($user1, $user2, $breakdown);

        return [
            'overall_score' => $compatibilityScore,
            'breakdown' => $breakdown,
            'insights' => $insights,
            'strengths' => $this->identifyStrengths($breakdown),
            'improvements' => $this->identifyImprovements($breakdown),
        ];
    }

    /**
     * Calculate skills compatibility
     */
    private function calculateSkillsCompatibility(User $user1, User $user2): array
    {
        $skills1 = $user1->profile->skills ?? [];
        $skills2 = $user2->profile->skills ?? [];

        $commonSkills = array_intersect($skills1, $skills2);
        $complementarySkills = array_diff(array_merge($skills1, $skills2), $commonSkills);

        $score = count($skills1) > 0 && count($skills2) > 0 
            ? (count($commonSkills) / max(count($skills1), count($skills2))) * 100 
            : 0;

        return [
            'score' => round($score, 2),
            'common_skills' => array_values($commonSkills),
            'complementary_skills' => array_values($complementarySkills),
            'user1_skills' => $skills1,
            'user2_skills' => $skills2,
        ];
    }

    /**
     * Calculate interests compatibility
     */
    private function calculateInterestsCompatibility(User $user1, User $user2): array
    {
        $interests1 = $user1->profile->interests ?? [];
        $interests2 = $user2->profile->interests ?? [];

        $commonInterests = array_intersect($interests1, $interests2);
        
        $score = count($interests1) > 0 && count($interests2) > 0 
            ? (count($commonInterests) / max(count($interests1), count($interests2))) * 100 
            : 0;

        return [
            'score' => round($score, 2),
            'common_interests' => array_values($commonInterests),
            'user1_interests' => $interests1,
            'user2_interests' => $interests2,
        ];
    }

    /**
     * Calculate work style compatibility
     */
    private function calculateWorkStyleCompatibility(User $user1, User $user2): array
    {
        $workStyle1 = $user1->profile->work_style ?? [];
        $workStyle2 = $user2->profile->work_style ?? [];
        $quizResults1 = $user1->profile->workstyle_results ?? [];
        $quizResults2 = $user2->profile->workstyle_results ?? [];

        $scores = [];

        // Basic work style compatibility
        if (!empty($workStyle1) && !empty($workStyle2)) {
            $total = 0;
            $count = 0;
            
            foreach ($workStyle1 as $key => $value1) {
                if (isset($workStyle2[$key])) {
                    $value2 = $workStyle2[$key];
                    $difference = abs($value1 - $value2);
                    $similarity = 1 - ($difference / 5); // Assuming 1-5 scale
                    $total += $similarity;
                    $count++;
                }
            }
            
            $scores['work_style'] = $count > 0 ? ($total / $count) * 100 : 0;
        }

        // Quiz results compatibility
        if (!empty($quizResults1) && !empty($quizResults2)) {
            $scores['quiz'] = $this->calculateQuizCompatibility($quizResults1, $quizResults2);
        }

        $overallScore = !empty($scores) ? array_sum($scores) / count($scores) : 0;

        return [
            'score' => round($overallScore, 2),
            'components' => $scores,
            'user1_work_style' => $workStyle1,
            'user2_work_style' => $workStyle2,
        ];
    }

    /**
     * Calculate goals compatibility
     */
    private function calculateGoalsCompatibility(User $user1, User $user2): array
    {
        $lookingFor1 = $user1->profile->looking_for ?? '';
        $lookingFor2 = $user2->profile->looking_for ?? '';
        $projectTypes1 = $user1->profile->project_types ?? [];
        $projectTypes2 = $user2->profile->project_types ?? [];

        $score = 0;
        $commonGoals = [];

        // Compare looking_for
        if ($lookingFor1 && $lookingFor2) {
            similar_text(strtolower($lookingFor1), strtolower($lookingFor2), $lookingForScore);
            $score += $lookingForScore;
            $commonGoals[] = "Both looking for: " . $lookingFor1;
        }

        // Compare project types
        $commonProjectTypes = array_intersect($projectTypes1, $projectTypes2);
        if (!empty($commonProjectTypes)) {
            $projectTypeScore = (count($commonProjectTypes) / max(count($projectTypes1), count($projectTypes2))) * 100;
            $score += $projectTypeScore;
            $commonGoals = array_merge($commonGoals, $commonProjectTypes);
        }

        $finalScore = $score > 0 ? $score / 2 : 0;

        return [
            'score' => round($finalScore, 2),
            'common_goals' => $commonGoals,
            'user1_goals' => [
                'looking_for' => $lookingFor1,
                'project_types' => $projectTypes1
            ],
            'user2_goals' => [
                'looking_for' => $lookingFor2,
                'project_types' => $projectTypes2
            ],
        ];
    }

    /**
     * Generate compatibility insights
     */
    private function generateCompatibilityInsights(User $user1, User $user2, array $breakdown): array
    {
        $insights = [];

        // Skills insights
        if ($breakdown['skills']['score'] > 70) {
            $insights[] = "Strong skills match! You share " . count($breakdown['skills']['common_skills']) . " skills.";
        } elseif ($breakdown['skills']['score'] < 30) {
            $insights[] = "Skills are complementary rather than overlapping - great for diverse project capabilities!";
        }

        // Interests insights
        if (!empty($breakdown['interests']['common_interests'])) {
            $insights[] = "You share interests in: " . implode(', ', array_slice($breakdown['interests']['common_interests'], 0, 3));
        }

        // Work style insights
        if ($breakdown['work_style']['score'] > 75) {
            $insights[] = "Excellent work style alignment! You'll likely work well together.";
        }

        // Goals insights
        if (!empty($breakdown['goals']['common_goals'])) {
            $insights[] = "You have aligned goals: " . implode(', ', array_slice($breakdown['goals']['common_goals'], 0, 2));
        }

        return array_slice($insights, 0, 5); // Limit to 5 insights
    }

    /**
     * Identify strengths
     */
    private function identifyStrengths(array $breakdown): array
    {
        $strengths = [];

        foreach ($breakdown as $category => $data) {
            if ($data['score'] > 70) {
                $strengths[] = [
                    'category' => $category,
                    'score' => $data['score'],
                    'description' => $this->getStrengthDescription($category, $data)
                ];
            }
        }

        return $strengths;
    }

    /**
     * Identify areas for improvement
     */
    private function identifyImprovements(array $breakdown): array
    {
        $improvements = [];

        foreach ($breakdown as $category => $data) {
            if ($data['score'] < 40) {
                $improvements[] = [
                    'category' => $category,
                    'score' => $data['score'],
                    'suggestion' => $this->getImprovementSuggestion($category, $data)
                ];
            }
        }

        return $improvements;
    }

    /**
     * Get strength description
     */
    private function getStrengthDescription(string $category, array $data): string
    {
        $descriptions = [
            'skills' => "Strong overlapping skillset for effective collaboration",
            'interests' => "Shared interests create great project synergy",
            'work_style' => "Compatible working styles for smooth cooperation",
            'goals' => "Aligned objectives and project interests"
        ];

        return $descriptions[$category] ?? "Strong compatibility in " . $category;
    }

    /**
     * Get improvement suggestion
     */
    private function getImprovementSuggestion(string $category, array $data): string
    {
        $suggestions = [
            'skills' => "Consider discussing how your different skills can complement each other",
            'interests' => "Explore potential shared interests through conversation",
            'work_style' => "Discuss your work preferences to find common ground",
            'goals' => "Align on project objectives and expectations"
        ];

        return $suggestions[$category] ?? "Discuss your " . $category . " to improve compatibility";
    }

    /**
     * Calculate quiz compatibility
     */
    private function calculateQuizCompatibility(array $quiz1, array $quiz2): float
    {
        $total = 0;
        $count = 0;

        foreach ($quiz1 as $key => $value1) {
            if (isset($quiz2[$key])) {
                $value2 = $quiz2[$key];
                $difference = abs($value1 - $value2);
                $similarity = 1 - ($difference / 5);
                $total += $similarity;
                $count++;
            }
        }

        return $count > 0 ? ($total / $count) * 100 : 0;
    }
}