<?php
// app/Http/Controllers/MessageController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Metch;
use App\Models\Message;
use App\Models\User;
use App\Events\NewMessage;

class MessageController extends Controller
{
    /**
     * Send message
     * POST /matches/{id}/message
     */
public function sendMessage(Request $request, $matchId)
{
    $user = auth()->user();
    
    $match = Metch::where('id', $matchId)
        ->where(function($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->orWhere('other_user_id', $user->id);
        })
        ->firstOrFail();

    $validator = Validator::make($request->all(), [
        'message' => 'required|string|max:1000'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors' => $validator->errors()
        ], 422);
    }

    $receiverId = $match->user_id == $user->id ? $match->other_user_id : $match->user_id;

    $message = Message::create([
        'match_id' => $matchId,
        'sender_id' => $user->id,
        'receiver_id' => $receiverId,
        'message' => $request->message,
        'message_type' => 'text',
    ]);

    broadcast(new NewMessage($message));

    return response()->json([
        'success' => true,
        'message' => 'Message sent',
        'data' => $message->load('sender')
    ]);
}

    /**
     * Send image message
     * POST /matches/{id}/message/image
     */
    public function sendImage(Request $request, $matchId)
    {
        $user = auth()->user();
        
        // Fixed: Using correct column names for Metch model
        $match = Metch::where('id', $matchId)
            ->where(function($query) use ($user) {
                $query->where('user_id_1', $user->id) // Fixed: consistent column names
                      ->orWhere('user_id_2', $user->id);
            })
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120' // 5MB
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        // Fixed: consistent column names
        $receiverId = $match->user_id_1 == $user->id ? $match->user_id_2 : $match->user_id_1;
        
        $path = $request->file('image')->store('message_images', 'public');

        $message = Message::create([
            'match_id' => $matchId,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'message' => 'Image message', // Consider storing the original filename
            'message_type' => 'image',
            'image_url' => Storage::url($path),
        ]);

        broadcast(new NewMessage($message));

        return redirect()->back()->with('success', 'Image sent!');
    }

    /**
     * Mark message as read
     * POST /messages/{id}/read
     */
    public function markAsRead($messageId)
    {
        $user = auth()->user();
        
        $message = Message::where('id', $messageId)
            ->where('receiver_id', $user->id)
            ->firstOrFail();

        $message->update([
            'is_read' => true,
            'read_at' => now()
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete message
     * DELETE /messages/{id}
     */
    public function deleteMessage($messageId)
    {
        $user = auth()->user();
        
        $message = Message::where('id', $messageId)
            ->where('sender_id', $user->id)
            ->firstOrFail();

        // Delete associated image file if it's an image message
        if ($message->message_type === 'image' && $message->image_url) {
            $path = str_replace('/storage/', '', $message->image_url);
            Storage::disk('public')->delete($path);
        }

        $message->delete();

        return redirect()->back()->with('success', 'Message deleted!');
    }

    /**
     * Get messages for a match
     * GET /matches/{id}/messages
     */
    public function getMessages($matchId)
    {
        $user = auth()->user();
        
        $match = Metch::where('id', $matchId)
            ->where(function($query) use ($user) {
                $query->where('user_id_1', $user->id)
                      ->orWhere('user_id_2', $user->id);
            })
            ->firstOrFail();

        $messages = Message::where('match_id', $matchId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['messages' => $messages]);
    }

    /**
     * Send auto-intro message
     */
    private function sendIntroMessage(Metch $match, User $sender)
    {
        // Fixed: consistent column names
        $receiverId = $match->user_id_1 == $sender->id ? $match->user_id_2 : $match->user_id_1;
        
        $introMessage = Message::create([
            'match_id' => $match->id,
            'sender_id' => $sender->id,
            'receiver_id' => $receiverId,
            'message' => "Hi! I'm excited to work together! Our compatibility score is " . ($match->compatibility_score ?? 0) . "%. Let's discuss our project ideas!",
            'message_type' => 'text',
        ]);

        broadcast(new NewMessage($introMessage));
    }
}