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
        $baseUrl = rtrim($request->getSchemeAndHttpHost() ?: config('app.url'), '/');

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($notification) use ($baseUrl) {
                try {
                    $data = is_array($notification->data ?? null) ? $notification->data : [];
                    $type = $data['type'] ?? 'unknown';

                    // Add resolvable profile picture URLs (proxy for Supabase) so avatars load
                    if ($type === 'friend_request' && !empty($data['sender_username'])) {
                        $data['sender_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['sender_username'], $data['sender_profile_picture'] ?? null);
                    }
                    if ($type === 'friend_request_accepted' && !empty($data['actor_username'])) {
                        $data['actor_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['actor_username'], $data['actor_profile_picture'] ?? null);
                    }
                    if (in_array($type, ['like', 'comment', 'mention', 'share', 'comment_like', 'comment_pinned', 'comment_reply']) && !empty($data['actor_username'])) {
                        $data['actor_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['actor_username'], $data['actor_profile_picture'] ?? null);
                    }
                    if (($type === 'community_invite' || $type === 'community_invite_suggested') && !empty($data['inviter_username'])) {
                        $data['inviter_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['inviter_username'], $data['inviter_profile_picture'] ?? null);
                    }
                    if ($type === 'community_member_joined' && !empty($data['user_username'])) {
                        $data['user_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['user_username'], $data['user_profile_picture'] ?? null);
                    }
                    if ($type === 'community_join_request' && !empty($data['user_username'])) {
                        $data['user_profile_picture'] = $this->notificationProfilePictureUrl($baseUrl, $data['user_username'], $data['user_profile_picture'] ?? null);
                    }

                    return [
                        'id' => $notification->id,
                        'type' => $type,
                        'data' => $data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at?->toIso8601String(),
                    ];
                } catch (\Throwable $e) {
                    return [
                        'id' => $notification->id,
                        'type' => 'unknown',
                        'data' => ['message' => 'Notification could not be loaded'],
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at?->toIso8601String(),
                    ];
                }
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
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Return a resolvable profile picture URL for notification payloads (proxy for Supabase).
     */
    private function notificationProfilePictureUrl(string $baseUrl, string $username, ?string $stored): ?string
    {
        if (empty($stored)) {
            return null;
        }
        if (str_contains($stored, 'supabase.co')) {
            return $baseUrl . '/api/users/' . $username . '/profile-picture';
        }
        return filter_var($stored, FILTER_VALIDATE_URL) ? $stored : asset('storage/' . $stored);
    }
}
