<?php
// app/Http/Controllers/NotificationController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * Show notifications
     * GET /notifications
     */
    public function index()
    {
        $user = auth()->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->latest()
            ->paginate(20);

        return view('notifications.index', compact('notifications'));
    }

    /**
     * Mark notification as read
     * POST /notifications/{id}/read
     */
    public function markAsRead($id)
    {
        $user = auth()->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->update([
            'is_read' => true,
            'read_at' => now()
        ]);

        return redirect()->back()->with('success', 'Notification marked as read!');
    }

    /**
     * Mark all notifications as read
     * POST /notifications/read-all
     */
    public function markAllAsRead()
    {
        $user = auth()->user();
        
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return redirect()->back()->with('success', 'All notifications marked as read!');
    }

    /**
     * Delete notification
     * DELETE /notifications/{id}
     */
    public function delete($id)
    {
        $user = auth()->user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notification->delete();

        return redirect()->back()->with('success', 'Notification deleted!');
    }
}