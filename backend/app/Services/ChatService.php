<?php
// app/Services/ChatService.php
namespace App\Services;

use App\Models\Metch;
use App\Models\Message;
use App\Models\User;
use App\Events\NewMessage;
use Illuminate\Support\Facades\Storage;

class ChatService
{
    /**
     * Send a text message
     */
public function sendTextMessage(Metch $match, User $sender, string $messageText): Message
{
    $receiverId = $match->user_id == $sender->id ? $match->other_user_id : $match->user_id;

    $message = Message::create([
        'match_id' => $match->id,
        'sender_id' => $sender->id,
        'receiver_id' => $receiverId,
        'message' => $messageText,
        'message_type' => 'text',
    ]);

    broadcast(new NewMessage($message));

    return $message;
}

    /**
     * Send an image message
     */
    
public function sendImageMessage(Metch $match, User $sender, $imageFile): Message
{
    $receiverId = $match->user_id == $sender->id ? $match->other_user_id : $match->user_id;

    $path = $imageFile->store('message_images', 'public');

    $message = Message::create([
        'match_id' => $match->id,
        'sender_id' => $sender->id,
        'receiver_id' => $receiverId,
        'message' => 'Sent an image',
        'message_type' => 'image',
        'image_url' => Storage::url($path),
    ]);

    broadcast(new NewMessage($message));

    return $message;
}

    /**
     * Send auto intro message when match is created
     */
    public function sendIntroMessage(Metch $match): void
    {
        $user1 = $match->user1;
        $user2 = $match->user2;

        $introMessage = "Hi! I'm excited to work together! Our compatibility score is {$match->compatibility_score}%. Let's discuss our project ideas!";

        $this->sendTextMessage($match, $user1, $introMessage);
        
        $match->update(['intro_message_sent' => true]);
    }

    /**
     * Mark messages as read
     */
    public function markMessagesAsRead(User $user, Metch $match): void
    {
        Message::where('match_id', $match->id)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);
    }

    /**
     * Get conversation history
     */
    public function getConversation(Metch $match, int $perPage = 20)
    {
        return Message::where('match_id', $match->id)
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get all conversations for a user
     */
public function getUserConversations(User $user)
{
    return Metch::where('user_id', $user->id)
        ->orWhere('other_user_id', $user->id)
        ->with(['user', 'otherUser'])
        ->get()
        ->map(function($match) use ($user) {
            $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;
            $latestMessage = $match->messages()->latest()->first();
            $unreadCount = $match->messages()
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();

            return [
                'match' => $match,
                'other_user' => $otherUser,
                'latest_message' => $latestMessage,
                'unread_count' => $unreadCount
            ];
        })
        ->sortByDesc(function($conversation) {
            return $conversation['latest_message']->created_at ?? $conversation['match']->created_at;
        })
        ->values();
}

    /**
     * Delete a message (soft delete)
     */
    public function deleteMessage(Message $message, User $user): bool
    {
        if ($message->sender_id !== $user->id) {
            return false;
        }

        $message->delete();
        return true;
    }
}
