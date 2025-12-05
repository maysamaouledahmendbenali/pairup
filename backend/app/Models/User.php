<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'password',
        'full_name',
        'profile_photo_url',
        'department',
        'bio',
        'google_id',
        'auth_provider',
        'profile_completed',
        'is_active',
        'last_seen'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'profile_completed' => 'boolean',
        'is_active' => 'boolean',
        'last_seen' => 'datetime',
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // Relationships
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function privacySettings()
    {
        return $this->hasOne(PrivacySetting::class);
    }

    public function statistics()
    {
        return $this->hasOne(UserStatistic::class);
    }

    public function swipesGiven()
    {
        return $this->hasMany(Swipe::class, 'swiper_id');
    }

    public function swipesReceived()
    {
        return $this->hasMany(Swipe::class, 'swiped_id');
    }

    public function matches()
    {
        return Metch::query()->where('user_id', $this->id)->orWhere('other_user_id', $this->id);
    }

    public function messagesSent()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'blocker_id', 'blocked_id')
            ->withPivot('reason', 'blocked_at');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Helper methods
    public function hasLiked(User $user): bool
    {
        return $this->swipesGiven()
            ->where('swiped_id', $user->id)
            ->where('action', 'like')
            ->exists();
    }

    public function hasMatched(User $user): bool
    {
        return Metch::where(function ($query) use ($user) {
            $query->where('user_id', $this->id)
                  ->where('other_user_id', $user->id);
        })->orWhere(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('other_user_id', $this->id);
        })->exists();
    }

    public function hasBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_id', $user->id)->exists();
    }
    
    // Add this method to get the unread messages count
    public function getUnreadMessagesCountAttribute()
    {
        return $this->messagesReceived()->where('is_read', false)->count();
    }

    // Add this method to get the unread notifications count
    public function getUnreadNotificationsCountAttribute()
    {
        return $this->notifications()->where('is_read', false)->count();
    }

    /**
     * Get users blocked by this user
     */
    public function blockedBy()
    {
        return $this->belongsToMany(User::class, 'blocked_users', 'blocked_id', 'blocker_id')
            ->withPivot('reason', 'blocked_at');
    }

    /**
     * Check if user is blocked by another user
     */
    public function isBlockedBy($userId)
    {
        return $this->blockedBy()->where('blocker_id', $userId)->exists();
    }
}