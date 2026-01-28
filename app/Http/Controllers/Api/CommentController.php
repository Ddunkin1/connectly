<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Get comments for a post.
     *
     * @param Request $request
     * @param Post $post
     * @return JsonResponse
     */
    public function index(Request $request, Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with(['user', 'replies.user', 'likes'])
            ->withCount(['replies', 'likes'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'comments' => CommentResource::collection($comments->items()),
            'pagination' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
            ],
        ]);
    }

    /**
     * Create a new comment.
     *
     * @param StoreCommentRequest $request
     * @param Post $post
     * @return JsonResponse
     */
    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        $comment = $post->allComments()->create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'parent_comment_id' => $request->parent_comment_id,
        ]);

        $comment->load(['user', 'replies']);

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => new CommentResource($comment),
        ], 201);
    }

    /**
     * Delete a comment.
     *
     * @param Request $request
     * @param Comment $comment
     * @return JsonResponse
     */
    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }
}
