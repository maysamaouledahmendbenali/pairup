<?php
// app/Services/NotificationService.php
namespace App\Services;

use App\Models\User;
use App\Models\Notification;
use App\Models\Metch;
use App\Models\Message;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send match notification
     */
 public function sendMatchNotification(Metch $match, User $user): void
{
    try {
        $otherUser = $match->user_id == $user->id ? $match->otherUser : $match->user;

        Notification::create([
            'user_id' => $user->id,
            'type' => 'new_match',
            'data' => [
                'match_id' => $match->id,
                'matched_user_id' => $otherUser->id,
                'matched_user_name' => $otherUser->full_name,
                'compatibility_score' => $match->compatibility_score,
                'message' => "You matched with {$otherUser->full_name}! Compatibility: {$match->compatibility_score}%"
            ]
        ]);

        $this->sendPushNotification($user, "New Match!", "You matched with {$otherUser->full_name}");

    } catch (\Exception $e) {
        Log::error('Match notification failed: ' . $e->getMessage());
    }
}

    /**
     * Send message notification
     */
    public function sendMessageNotification(Message $message): void
    {
        try {
            $sender = $message->sender;
            $receiver = $message->receiver;

            // Create in-app notification
            Notification::create([
                'user_id' => $receiver->id,
                'type' => 'new_message',
                'data' => [
                    'message_id' => $message->id,
                    'match_id' => $message->match_id,
                    'sender_id' => $sender->id,
                    'sender_name' => $sender->full_name,
                    'message_preview' => strlen($message->message) > 50 
                        ? substr($message->message, 0, 50) . '...' 
                        : $message->message,
                    'message_type' => $message->message_type
                ]
            ]);

            // Send push notification
            $title = "New message from {$sender->full_name}";
            $body = $message->message_type === 'text' 
                ? (strlen($message->message) > 100 ? substr($message->message, 0, 100) . '...' : $message->message)
                : 'Sent a photo';

            $this->sendPushNotification($receiver, $title, $body);

        } catch (\Exception $e) {
            Log::error('Message notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Send like notification
     */
    public function sendLikeNotification(User $swiper, User $swiped): void
    {
        try {
            Notification::create([
                'user_id' => $swiped->id,
                'type' => 'new_like',
                'data' => [
                    'swiper_id' => $swiper->id,
                    'swiper_name' => $swiper->full_name,
                    'message' => "{$swiper->full_name} liked your profile!"
                ]
            ]);

            $this->sendPushNotification($swiped, "New Like!", "{$swiper->full_name} liked your profile");

        } catch (\Exception $e) {
            Log::error('Like notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Send push notification via FCM
     */
    private function sendPushNotification(User $user, string $title, string $body): void
    {
        // This would integrate with Firebase Cloud Messaging
        // For now, we'll log it
        Log::info("Push Notification - User: {$user->id}, Title: {$title}, Body: {$body}");
        
        // Implementation for FCM:
        /*
        $fcmToken = $user->fcm_token; // You'd need to store this
        if ($fcmToken) {
            // Use laravel-fcm or similar package
            FCM::sendTo($fcmToken, [
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                ],
                'data' => [
                    'type' => 'chat_message',
                    'user_id' => $user->id,
                ]
            ]);
        }
        */
    }

    /**
     * Mark notifications as read
     */
    public function markNotificationsAsRead(User $user, array $notificationIds = []): void
    {
        $query = Notification::where('user_id', $user->id)
            ->where('is_read', false);

        if (!empty($notificationIds)) {
            $query->whereIn('id', $notificationIds);
        }

        $query->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }

    /**
     * Get unread notification count
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }
}