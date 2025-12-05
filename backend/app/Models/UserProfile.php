<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'skills',
        'interests',
        'work_style',
        'looking_for',
        'availability',
        'project_types',
        'workstyle_quiz_completed',
        'workstyle_results',
    ];

    protected $casts = [
        'skills' => 'array',
        'interests' => 'array',
        'work_style' => 'array',
        'project_types' => 'array',
        'workstyle_quiz_completed' => 'boolean',
        'workstyle_results' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
