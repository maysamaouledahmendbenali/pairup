<?php
// app/Http/Controllers/ProfileController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Update profile
     * POST /profile/update
     */
    public function update(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'department' => 'sometimes|string|max:100',
            'bio' => 'sometimes|string|max:500',
            'skills' => 'sometimes|array',
            'interests' => 'sometimes|array',
            'work_style' => 'sometimes|array',
            'looking_for' => 'sometimes|string',
            'availability' => 'sometimes|string',
            'project_types' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Update user fields
        $user->update($request->only(['full_name', 'department', 'bio']));

        // Update profile fields
        $profileData = $request->only([
            'skills', 'interests', 'work_style', 
            'looking_for', 'availability', 'project_types'
        ]);

        if (!empty($profileData)) {
            $user->profile()->updateOrCreate([], $profileData);
        }

        return redirect()->back()->with('success', 'Profile updated successfully!');
    }

    /**
     * Upload profile photo
     * POST /profile/photo
     */
    public function uploadPhoto(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $path = $request->file('photo')->store('profile_photos', 'public');

        $user->update([
            'profile_photo_url' => Storage::url($path),
        ]);

        return redirect()->back()->with('success', 'Profile photo uploaded successfully!');
    }

    /**
     * Delete profile photo
     * POST /profile/photo/delete
     */
    public function deletePhoto()
    {
        $user = auth()->user();

        if ($user->profile_photo_url) {
            $path = str_replace('/storage/', '', $user->profile_photo_url);
            Storage::disk('public')->delete($path);
            $user->update(['profile_photo_url' => null]);
        }

        return redirect()->back()->with('success', 'Profile photo removed successfully!');
    }

    /**
     * Complete profile
     * POST /profile/complete
     */
    public function completeProfile()
    {
        $user = auth()->user();
        $user->update(['profile_completed' => true]);

        return redirect()->back()->with('success', 'Profile marked as complete!');
    }

    /**
     * Submit workstyle quiz
     * POST /profile/quiz
     */
    public function submitQuiz(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'answers' => 'required|array|min:3|max:3'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $user->profile()->update([
            'workstyle_quiz_completed' => true,
            'workstyle_results' => $request->answers
        ]);

        return redirect()->back()->with('success', 'Workstyle quiz submitted successfully!');
    }
}
