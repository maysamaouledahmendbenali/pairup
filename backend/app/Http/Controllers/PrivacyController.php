<?php
// app/Http/Controllers/PrivacyController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BlockedUser;
use App\Models\Report;
use App\Models\User;
use App\Models\Metch; // Fixed: Added missing import
use Illuminate\Support\Facades\Validator;

class PrivacyController extends Controller
{
    /**
     * Update privacy settings
     * POST /privacy/settings
     */
    public function updateSettings(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'profile_visibility' => 'required|in:public,friends,private',
            'show_online_status' => 'required|boolean',
            'allow_messages_from' => 'required|in:everyone,matches,none',
            'data_sharing' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $user->privacySettings()->update($request->all());

        return redirect()->back()->with('success', 'Privacy settings updated!');
    }

    /**
     * Block user
     * POST /privacy/block/{userId}
     */
    public function blockUser($userId)
    {
        $user = auth()->user();
        $userToBlock = User::findOrFail($userId);

        // Check if already blocked
        $existingBlock = BlockedUser::where('blocker_id', $user->id)
            ->where('blocked_id', $userId)
            ->first();

        if ($existingBlock) {
            return redirect()->back()->with('error', 'User already blocked!');
        }

        BlockedUser::create([
            'blocker_id' => $user->id,
            'blocked_id' => $userId,
            'reason' => request('reason', 'No reason provided')
        ]);

        // Delete any existing matches
        $match = Metch::where(function($query) use ($user, $userId) {
            $query->where('user_id_1', $user->id)
                  ->where('user_id_2', $userId);
        })->orWhere(function($query) use ($user, $userId) {
            $query->where('user_id_1', $userId)
                  ->where('user_id_2', $user->id);
        })->first();

        if ($match) {
            $match->messages()->delete();
            $match->delete();
        }

        return redirect()->back()->with('success', 'User blocked successfully!');
    }

    /**
     * Unblock user
     * POST /privacy/unblock/{userId}
     */
    public function unblockUser($userId)
    {
        $user = auth()->user();
        
        BlockedUser::where('blocker_id', $user->id)
            ->where('blocked_id', $userId)
            ->delete();

        return redirect()->back()->with('success', 'User unblocked successfully!');
    }

    /**
     * Show blocked users
     * GET /privacy/blocked
     */
    public function getBlockedUsers()
    {
        $user = auth()->user();
        
        $blockedUsers = BlockedUser::where('blocker_id', $user->id)
            ->with('blocked')
            ->get();

        return view('privacy.blocked', compact('blockedUsers'));
    }

    /**
     * Report user
     * POST /privacy/report/{userId}
     */
    public function reportUser($userId)
    {
        $user = auth()->user();
        $reportedUser = User::findOrFail($userId);

        $validator = Validator::make(request()->all(), [
            'reason' => 'required|in:spam,harassment,fake,inappropriate,other',
            'description' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        Report::create([
            'reporter_id' => $user->id,
            'reported_id' => $userId,
            'reason' => request('reason'),
            'description' => request('description')
        ]);

        return redirect()->back()->with('success', 'User reported successfully! Our team will review this report.');
    }
}