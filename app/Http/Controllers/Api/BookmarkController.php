<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    /**
     * List bookmarked posts for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $posts = $request->user()
            ->bookmarkedPosts()
            ->with(['user', 'hashtags', 'sharedPost.user'])
            ->withCount(['likes', 'allComments as comments_count'])
            ->orderByPivot('created_at', 'desc')
            ->paginate(15);

        if ($request->user()) {
            $likedPostIds = $request->user()
                ->likes()
                ->where('likeable_type', Post::class)
                ->whereIn('likeable_id', $posts->pluck('id'))
                ->pluck('likeable_id')
                ->toArray();

            $posts->getCollection()->transform(function ($post) use ($likedPostIds) {
                $post->is_liked = in_array($post->id, $likedPostIds);
                $post->is_bookmarked = true;
                return $post;
            });
        }

        return response()->json([
            'posts' => PostResource::collection($posts->items()),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    /**
     * Add a post to bookmarks.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        if ($user->bookmarkedPosts()->where('post_id', $post->id)->exists()) {
            return response()->json([
                'message' => 'Post already bookmarked',
            ], 400);
        }

        $user->bookmarkedPosts()->attach($post->id);

        return response()->json([
            'message' => 'Post bookmarked successfully',
        ], 201);
    }

    /**
     * Remove a post from bookmarks.
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        $request->user()->bookmarkedPosts()->detach($post->id);

        return response()->json([
            'message' => 'Post removed from bookmarks',
        ]);
    }
}
