<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Post;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->data['type'] ?? 'unknown',
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at?->toIso8601String(),
                ];
            });

        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Simple highlights endpoint (e.g. for digest view).
     */
    public function highlights(Request $request): JsonResponse
    {
        $user = $request->user();

        $oneWeekAgo = now()->subWeek();

        $newFollowers = $user->followers()
            ->wherePivot('created_at', '>=', $oneWeekAgo)
            ->limit(10)
            ->get(['users.id', 'users.name', 'users.username', 'users.profile_picture']);

        $topPosts = $user->posts()
            ->where('is_archived', false)
            ->where('created_at', '>=', $oneWeekAgo)
            ->withCount(['likes', 'allComments'])
            ->orderByRaw('(likes_count + all_comments_count) desc')
            ->limit(5)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'content_preview' => mb_substr((string) $post->content, 0, 100),
                'likes_count' => $post->likes_count ?? 0,
                'comments_count' => $post->all_comments_count ?? 0,
                'created_at' => $post->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'highlights' => [
                'new_followers' => $newFollowers->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'profile_picture' => $u->profile_picture,
                ]),
                'top_posts' => $topPosts,
            ],
        ]);
    }

    /**
     * Get unread notifications count only.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }
}
