<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedUser extends Model
{
    //    use HasUuids;
    public $timestamps = false;
    protected $fillable = ['blocker_id', 'blocked_id', 'reason'];
}
