<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    
    protected $fillable = ['match_id', 'sender_id', 'receiver_id', 'message', 'message_type', 'image_url', 'is_read'];
    protected $casts = ['is_read' => 'boolean', 'read_at' => 'datetime'];
    
    public function match() { return $this->belongsTo(Metch::class); }
    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
    public function receiver() { return $this->belongsTo(User::class, 'receiver_id'); }
}
 