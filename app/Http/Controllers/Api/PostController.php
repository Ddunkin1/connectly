<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Post\StorePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        private PostService $postService
    ) {
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
        } catch (\Exception $e) {
            \Log::error('Post creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to create post',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the post',
                'hint' => config('app.debug') ? 'Check if database migration was run and Supabase bucket exists' : null,
            ], 500);
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
        $post->load(['user', 'hashtags', 'likes']);

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
