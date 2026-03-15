<?php

namespace App\Http\Controllers\Api;

use App\Events\PostLiked;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Notifications\LikeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Like a post.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function like(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        if ($post->isLikedBy($user)) {
            return response()->json([
                'message' => 'Post already liked',
            ], 422);
        }

        $post->likes()->create([
            'user_id' => $user->id,
        ]);

        // Notify post owner (don't notify if liking own post)
        if ($post->user_id !== $user->id) {
            $post->user->notify(new LikeNotification($post->load('user'), $user));
        }

        $likesCount = $post->likes()->count();
        broadcast(new PostLiked($post->id, $likesCount))->toOthers();

        return response()->json([
            'message' => 'Post liked successfully',
            'likes_count' => $likesCount,
        ]);
    }

    /**
     * Unlike a post.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function unlike(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        $like = $post->likes()->where('user_id', $user->id)->first();

        if (!$like) {
            return response()->json([
                'message' => 'Post not liked',
            ], 422);
        }

        $like->delete();

        $likesCount = $post->likes()->count();
        broadcast(new PostLiked($post->id, $likesCount))->toOthers();

        return response()->json([
            'message' => 'Post unliked successfully',
            'likes_count' => $likesCount,
        ]);
    }
}
