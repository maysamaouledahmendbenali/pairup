<?php
// app/Http/Controllers/AuthController.php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\PrivacySetting;
use App\Models\UserStatistic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth; 
class AuthController extends Controller
{
    
    // ... (keep all existing methods)
    
    /**
     * Handle registration (API)
     * POST /api/register
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function registerApi(Request $request)
    {
        $data = $request->json()->all() ?: $request->all();
        $validator = Validator::make($data, [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'auth_provider' => 'email',
            'is_active' => true, // Add this to ensure the user is active
        ]);

        // Create related records
        UserProfile::create(['user_id' => $user->id]);
        PrivacySetting::create(['user_id' => $user->id]);
        UserStatistic::create(['user_id' => $user->id]);

        // Generate JWT token instead of Sanctum token
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'user' => $user->makeHidden(['password', 'remember_token']),
            'token' => $token
        ], 201);
    }

    /**
     * Handle login (API)
     * POST /api/login
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function loginApi(Request $request)
    {
        $data = $request->json()->all() ?: $request->all();
        $validator = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only(['email', 'password']);
        
        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();
        $user->update(['last_seen' => now()]);
        
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
            'expires_in' => auth('api')->factory()->getTTL() * 60 // Time to live in seconds
        ]);
    }
    
    /**
     * Logout (Invalidate the token)
     * POST /api/logout
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            
            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to logout, please try again'
            ], 500);
        }
    }
    
    /**
     * Refresh a token
     * POST /api/refresh
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        
        return response()->json([
            'success' => true,
            'token' => $token,
            'expires_in' => auth('api')->factory()->getTTL() * 60
        ]);
    }
    
    /**
     * Get the authenticated User
     * GET /api/me
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json([
            'success' => true,
            'user' => auth('api')->user()
        ]);
    }
    // ... (keep all other methods)


    /*
    |--------------------------------------------------------------------------
    | Social Authentication Methods
    |--------------------------------------------------------------------------
    | These methods handle OAuth flows for external providers like Google.
    */

    /**
     * Redirect the user to the Google authentication page.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                // If user exists but doesn't have a google_id, link it
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->id]);
                }
            } else {
                // Create a new user
                $user = User::create([
                    'full_name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'profile_photo_url' => $googleUser->avatar,
                    'auth_provider' => 'google',
                    'email_verified_at' => now(),
                ]);

                UserProfile::create(['user_id' => $user->id]);
                PrivacySetting::create(['user_id' => $user->id]);
                UserStatistic::create(['user_id' => $user->id]);
            }

            Auth::login($user);

            return redirect('/dashboard')->with('success', 'Google login successful!');

        } catch (\Exception $e) {
            // You might want to log the exception here
            // \Log::error('Google OAuth Error: ' . $e->getMessage());
            return redirect('/login')->withErrors([
                'google' => 'Google authentication failed. Please try again.'
            ]);
        }
    }
}
