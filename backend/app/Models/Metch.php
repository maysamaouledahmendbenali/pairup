<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Metch extends Model
{
    protected $table = 'matches';
    protected $fillable = ['user_id', 'other_user_id', 'compatibility_score', 'intro_message_sent', 'matched_at'];
    protected $casts = ['matched_at' => 'datetime', 'intro_message_sent' => 'boolean'];
    
    // Fixed relationship names
    public function user() { 
        return $this->belongsTo(User::class, 'user_id'); 
    }
    
    public function otherUser() { 
        return $this->belongsTo(User::class, 'other_user_id'); 
    }
    
    public function messages() { 
        return $this->hasMany(Message::class, 'match_id'); 
    }
}