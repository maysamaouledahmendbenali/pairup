<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserStatistic extends Model
{
    protected $fillable = ['user_id', 'total_likes_given', 'total_likes_received', 'total_matches', 'total_messages_sent', 'profile_views'];
}
