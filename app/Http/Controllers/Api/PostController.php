<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Post\StorePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Like;
use App\Models\Post;
use App\Notifications\ShareNotification;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PostController extends Controller
{
    public function __construct(
        private PostService $postService
    ) {
    }

    /**
     * Get suggested posts for the feed.
     */
    public function suggested(Request $request): JsonResponse
    {
        $posts = $this->postService->getSuggestedPosts($request->user(), 5);

        $user = $request->user();
        $bookmarkedIds = $user->bookmarkedPosts()
            ->whereIn('posts.id', $posts->pluck('id'))
            ->pluck('posts.id')
            ->toArray();
        $likedIds = Like::where('likeable_type', Post::class)
            ->where('user_id', $user->id)
            ->whereIn('likeable_id', $posts->pluck('id'))
            ->pluck('likeable_id')
            ->toArray();
        $posts->each(function ($post) use ($bookmarkedIds, $likedIds) {
            $post->is_bookmarked = in_array($post->id, $bookmarkedIds);
            $post->is_liked = in_array($post->id, $likedIds);
        });

        return response()->json(['posts' => PostResource::collection($posts)]);
    }

    /**
     * Get feed posts (posts from followed users).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $posts = $this->postService->getFeed($request->user(), 15);

        // Load recent likers (3 per post) in bulk to avoid N+1
        $postIds = $posts->pluck('id')->toArray();
        $recentLikes = Like::where('likeable_type', Post::class)
            ->whereIn('likeable_id', $postIds)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        $recentLikersByPost = [];
        foreach ($recentLikes->groupBy('likeable_id') as $postId => $likes) {
            $recentLikersByPost[$postId] = $likes->take(3)->pluck('user')->filter()->values();
        }

        $posts->getCollection()->each(function ($post) use ($recentLikersByPost) {
            $post->recent_likers = $recentLikersByPost[$post->id] ?? collect();
        });

        $bookmarkedIds = $request->user()->bookmarkedPosts()
            ->whereIn('posts.id', $posts->pluck('id'))
            ->pluck('posts.id')
            ->toArray();
        $likedIds = Like::where('likeable_type', Post::class)
            ->where('user_id', $request->user()->id)
            ->whereIn('likeable_id', $posts->pluck('id'))
            ->pluck('likeable_id')
            ->toArray();
        $posts->getCollection()->each(function ($post) use ($bookmarkedIds, $likedIds) {
            $post->is_bookmarked = in_array($post->id, $bookmarkedIds);
            $post->is_liked = in_array($post->id, $likedIds);
        });

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
     * Create a new post.
     *
     * @param StorePostRequest $request
     * @return JsonResponse
     */
    public function store(StorePostRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            
            // Include file if uploaded
            if ($request->hasFile('media')) {
                $data['media'] = $request->file('media');
            }
            
            // Ensure content is set (can be empty string if media exists)
            if (!isset($data['content'])) {
                $data['content'] = '';
            }
            
            $post = $this->postService->createPost($request->user(), $data);

            return response()->json([
                'message' => 'Post created successfully',
                'post' => new PostResource($post),
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Post creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->all(),
            ]);

            $errorMsg = $e->getMessage();
            $userMessage = $errorMsg;
            if (str_contains($errorMsg, 'upload media') || str_contains($errorMsg, 'upload image')) {
                $userMessage = 'Image upload failed. Add a caption and try again, or post text only.';
            }

            return response()->json([
                'message' => $userMessage,
                'errors' => ['media' => [$userMessage]],
            ], 422);
        }
    }

    /**
     * Get a specific post.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        $post->loadCount(['likes', 'allComments']);
        $post->load(['user', 'hashtags', 'sharedPost.user', 'poll.options']);

        if ($request->user()) {
            $post->is_liked = $post->likes()->where('user_id', $request->user()->id)->exists();
            $post->is_bookmarked = $request->user()->bookmarkedPosts()->where('post_id', $post->id)->exists();
        }

        $post->recent_likers = $post->likes()->with('user')->latest()->limit(3)->get()->pluck('user')->filter()->values();

        return response()->json([
            'post' => new PostResource($post),
        ]);
    }

    /**
     * Update a post.
     *
     * @param UpdatePostRequest $request
     * @param Post $post
     * @return JsonResponse
     */
    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $post = $this->postService->updatePost($post, $request->validated());

        return response()->json([
            'message' => 'Post updated successfully',
            'post' => new PostResource($post),
        ]);
    }

    /**
     * Record a share (increment shares_count when user shares the post).
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function share(Request $request, Post $post): JsonResponse
    {
        $post->increment('shares_count');

        if ($post->user_id !== $request->user()->id) {
            $post->load('user');
            $post->user->notify(new ShareNotification($post->fresh(), $request->user()));
        }

        return response()->json([
            'message' => 'Share recorded',
            'shares_count' => $post->fresh()->shares_count,
        ]);
    }

    /**
     * Delete a post.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }
}
