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
        $commenterIds = $user->posts()->join('comments', 'comments.post_id', '=', 'posts.id')->pluck('comments.user_id');
        $followerIds = $user->followers()->pluck('id');
        $reach = $followerIds->merge($likerIds)->merge($commenterIds)->unique()->count();

        return response()->json([
            'analytics' => [
                'posts_count' => $postsCount,
                'likes_received' => $likesReceived,
                'comments_received' => (int) $commentsReceived,
                'followers_count' => $followersCount,
                'following_count' => $followingCount,
                'reach_estimate' => $reach,
            ],
        ]);
    }
}
