<?php

namespace App\Http\Controllers\Api;

use App\Events\PostCommented;
use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\CommunityPost;
use App\Models\Post;
use App\Notifications\CommentNotification;
use App\Services\MentionService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function __construct(
        private MentionService $mentionService,
        private SupabaseService $supabaseService
    ) {
    }
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
        $user = $request->user();

        // If this post belongs to a community, only members can comment
        $communityPost = CommunityPost::where('post_id', $post->id)->first();
        if ($communityPost) {
            $community = $communityPost->community;
            $isMember = $community->members()->where('user_id', $user->id)->exists()
                || $community->creator_id === $user->id;
            if (!$isMember) {
                return response()->json([
                    'message' => 'You must be a member of this community to comment on posts',
                ], 403);
            }
        }

        $data = [
            'user_id' => $user->id,
            'content' => $request->input('content', ''),
            'parent_comment_id' => $request->parent_comment_id,
        ];

        if ($request->hasFile('media')) {
            try {
                $file = $request->file('media');
                $url = $this->supabaseService->uploadFile($file, 'comment-attachments');
                if ($url) {
                    $mime = $file->getMimeType();
                    $data['media_url'] = $url;
                    $data['media_type'] = str_starts_with((string) $mime, 'video/') ? 'video' : 'image';
                }
            } catch (\Throwable $e) {
                Log::warning('Comment media upload failed', ['error' => $e->getMessage()]);
            }
        }

        $comment = $post->allComments()->create($data);

        $comment->load(['user', 'replies']);

        // Notify post owner (don't notify if commenting on own post)
        if ($post->user_id !== $user->id) {
            $post->user->notify(new CommentNotification($post, $comment, $user));
        }

        // Notify mentioned users in comment
        $this->mentionService->notifyMentionedUsers($request->content, $post, $user, 'comment');

        $post->loadCount('allComments');
        $commentsCount = $post->allComments()->count();
        broadcast(new PostCommented($post->id, $commentsCount, $comment))->toOthers();

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => new CommentResource($comment),
            'comments_count' => $commentsCount,
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
