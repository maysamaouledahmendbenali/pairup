<?php
// app/Services/UserService.php
namespace App\Services;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\UserStatistic;
use App\Models\PrivacySetting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserService
{
    /**
     * Create a new user with all related records
     */
    public function createUser(array $data): User
    {
        $user = User::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'auth_provider' => $data['auth_provider'] ?? 'email',
            'google_id' => $data['google_id'] ?? null,
            'profile_photo_url' => $data['profile_photo_url'] ?? null,
        ]);

        // Create related records
        UserProfile::create(['user_id' => $user->id]);
        PrivacySetting::create(['user_id' => $user->id]);
        UserStatistic::create(['user_id' => $user->id]);

        return $user->load(['profile', 'privacySettings', 'statistics']);
    }

    /**
     * Update user profile
     */
    public function updateUserProfile(User $user, array $data): User
    {
        // Update user basic info
        if (isset($data['full_name']) || isset($data['department']) || isset($data['bio'])) {
            $user->update(collect($data)->only(['full_name', 'department', 'bio'])->toArray());
        }

        // Update user profile
        if (isset($data['skills']) || isset($data['interests']) || isset($data['work_style'])) {
            $profileData = collect($data)->only([
                'skills', 'interests', 'work_style', 
                'looking_for', 'availability', 'project_types'
            ])->toArray();

            $user->profile()->update($profileData);
        }

        return $user->fresh()->load('profile');
    }

    /**
     * Upload profile photo
     */
    public function uploadProfilePhoto(User $user, $photoFile): string
    {
        // Delete old photo if exists
        if ($user->profile_photo_url) {
            $oldPath = str_replace('/storage/', '', $user->profile_photo_url);
            Storage::disk('public')->delete($oldPath);
        }

        // Store new photo
        $path = $photoFile->store('profile_photos', 'public');
        $photoUrl = Storage::url($path);

        $user->update(['profile_photo_url' => $photoUrl]);

        return $photoUrl;
    }

    /**
     * Delete profile photo
     */
    public function deleteProfilePhoto(User $user): void
    {
        if ($user->profile_photo_url) {
            $path = str_replace('/storage/', '', $user->profile_photo_url);
            Storage::disk('public')->delete($path);
            $user->update(['profile_photo_url' => null]);
        }
    }

    /**
     * Complete user profile
     */
    public function completeProfile(User $user): void
    {
        $user->update(['profile_completed' => true]);
    }

    /**
     * Submit workstyle quiz
     */
    public function submitWorkstyleQuiz(User $user, array $answers): void
    {
        $user->profile()->update([
            'workstyle_quiz_completed' => true,
            'workstyle_results' => $answers
        ]);
    }

    /**
     * Update user statistics
     */
    public function updateUserStatistics(User $user, string $action): void
    {
        $statistics = $user->statistics;

        switch ($action) {
            case 'like_given':
                $statistics->increment('total_likes_given');
                break;
            case 'like_received':
                $statistics->increment('total_likes_received');
                break;
            case 'match_created':
                $statistics->increment('total_matches');
                break;
            case 'message_sent':
                $statistics->increment('total_messages_sent');
                break;
            case 'profile_viewed':
                $statistics->increment('profile_views');
                break;
        }
    }

    public function decrementUserStatistics(User $user, string $action): void
    {
        $statistics = $user->statistics;

        switch ($action) {
            case 'like_given':
                $statistics->update([
                    'total_likes_given' => max(0, $statistics->total_likes_given - 1),
                ]);
                break;
            case 'like_received':
                $statistics->update([
                    'total_likes_received' => max(0, $statistics->total_likes_received - 1),
                ]);
                break;
            case 'match_created':
                $statistics->update([
                    'total_matches' => max(0, $statistics->total_matches - 1),
                ]);
                break;
            case 'message_sent':
                $statistics->update([
                    'total_messages_sent' => max(0, $statistics->total_messages_sent - 1),
                ]);
                break;
            case 'profile_viewed':
                $statistics->update([
                    'profile_views' => max(0, $statistics->profile_views - 1),
                ]);
                break;
        }
    }

    /**
     * Get user statistics summary
     */
    public function getUserStatistics(User $user): array
    {
        $stats = $user->statistics;

        return [
            'total_likes_given' => $stats->total_likes_given,
            'total_likes_received' => $stats->total_likes_received,
            'total_matches' => $stats->total_matches,
            'total_messages_sent' => $stats->total_messages_sent,
            'profile_views' => $stats->profile_views,
            'match_rate' => $stats->total_likes_given > 0 
                ? round(($stats->total_matches / $stats->total_likes_given) * 100, 2) 
                : 0,
        ];
    }

    /**
     * Search users by criteria
     */
    public function searchUsers(array $criteria, User $excludeUser = null)
    {
        $query = User::with('profile')
            ->where('profile_completed', true)
            ->where('is_active', true);

        if ($excludeUser) {
            $query->where('id', '!=', $excludeUser->id);
        }

        if (isset($criteria['skills'])) {
            $query->whereHas('profile', function($q) use ($criteria) {
                $q->whereJsonContains('skills', $criteria['skills']);
            });
        }

        if (isset($criteria['interests'])) {
            $query->whereHas('profile', function($q) use ($criteria) {
                $q->whereJsonContains('interests', $criteria['interests']);
            });
        }

        if (isset($criteria['department'])) {
            $query->where('department', 'like', "%{$criteria['department']}%");
        }

        return $query->paginate(20);
    }
}
