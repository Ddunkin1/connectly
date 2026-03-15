<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Get analytics for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $postsCount = $user->posts()->where('is_archived', false)->count();
        $likesReceived = Like::where('likeable_type', Post::class)
            ->whereIn('likeable_id', $user->posts()->pluck('id'))
            ->count();
        $commentsReceived = $user->posts()->withCount('allComments')->get()->sum('all_comments_count');
        $followersCount = $user->followers()->count();
        $followingCount = $user->following()->count();

        // "Reach" as rough estimate: unique users (followers + likers + commenters)
        $postIds = $user->posts()->pluck('id');
        $likerIds = $postIds->isNotEmpty()
            ? Like::where('likeable_type', Post::class)->whereIn('likeable_id', $postIds)->pluck('user_id')
            : collect();
        $commenterIds = $postIds->isNotEmpty()
            ? \Illuminate\Support\Facades\DB::table('comments')->whereIn('post_id', $postIds)->pluck('user_id')
            : collect();
        $followerIds = $user->followers()->pluck('users.id');
        $reach = $followerIds->merge($likerIds)->merge($commenterIds)->unique()->count();

        $posts = $user->posts()
            ->where('is_archived', false)
            ->withCount(['likes', 'allComments'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'content_preview' => mb_substr((string) $post->content, 0, 100),
                'likes_count' => $post->likes_count ?? 0,
                'comments_count' => $post->all_comments_count ?? 0,
                'created_at' => $post->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'analytics' => [
                'posts_count' => $postsCount,
                'likes_received' => $likesReceived,
                'comments_received' => (int) $commentsReceived,
                'followers_count' => $followersCount,
                'following_count' => $followingCount,
                'reach_estimate' => $reach,
                'recent_posts' => $posts,
            ],
        ]);
    }
}
