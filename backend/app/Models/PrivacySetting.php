<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivacySetting extends Model
{
    protected $fillable = ['user_id', 'profile_visibility', 'show_online_status', 'allow_messages_from', 'data_sharing'];
    protected $casts = ['show_online_status' => 'boolean', 'data_sharing' => 'boolean'];
    
    public function user() { return $this->belongsTo(User::class); }
}
