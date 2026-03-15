<?php

namespace App\Http\Controllers\Api;

use App\Events\PostCommented;
use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\CommunityPost;
use App\Models\Like;
use App\Models\Post;
use App\Notifications\CommentNotification;
use App\Notifications\CommentPinnedNotification;
use App\Notifications\CommentReplyNotification;
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
        // Load replies recursively (4 levels: top-level + 3 levels of nested replies), ordered by created_at
        $comments = $post->comments()
            ->with([
                'user',
                'replies' => function ($q) {
                    $q->with('user')
                        ->with([
                            'replies' => function ($q2) {
                                $q2->with('user')
                                    ->with(['replies' => function ($q3) {
                                        $q3->with('user')->orderBy('created_at');
                                    }])
                                    ->orderBy('created_at');
                            },
                        ])
                        ->orderBy('created_at');
                },
                'likes',
            ])
            ->withCount(['replies', 'likes'])
            ->orderByRaw('CASE WHEN pinned_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('pinned_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Collect all comment IDs in the tree (any depth) and set is_liked
        $currentUser = $request->user();
        if ($currentUser) {
            $allComments = $comments->items();
            $commentIds = $this->collectCommentIdsRecursive($allComments);
            $likedCommentIds = [];
            if (!empty($commentIds)) {
                $likedCommentIds = Like::where('likeable_type', Comment::class)
                    ->where('user_id', $currentUser->id)
                    ->whereIn('likeable_id', $commentIds)
                    ->pluck('likeable_id')
                    ->toArray();
            }
            $this->setIsLikedRecursive($allComments, $likedCommentIds);
        }

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
        if ($post->user_id !== $user->id && $post->user) {
            $post->user->notify(new CommentNotification($post, $comment, $user));
        }

        // Notify parent comment author when replying to a comment (don't notify if replying to own comment)
        $parentCommentId = $request->parent_comment_id ?? $comment->parent_comment_id;
        if ($parentCommentId) {
            $parentComment = Comment::with('user')->find($parentCommentId);
            if ($parentComment && $parentComment->user_id !== $user->id && $parentComment->user) {
                $parentComment->user->notify(new CommentReplyNotification($post, $parentComment, $comment, $user));
            }
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

    /**
     * Pin a top-level comment. Only the post author can pin; only one comment per post can be pinned.
     */
    public function pin(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->parent_comment_id !== null) {
            return response()->json(['message' => 'Only top-level comments can be pinned.'], 422);
        }

        $post = $comment->post;
        if ($request->user()->id !== $post->user_id) {
            return response()->json(['message' => 'Only the post author can pin comments.'], 403);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($comment, $post) {
            $post->allComments()->whereNotNull('pinned_at')->update(['pinned_at' => null]);
            $comment->update(['pinned_at' => now()]);
        });

        // Notify comment author (don't notify if they pinned their own comment)
        $pinnedBy = $request->user();
        if ($comment->user_id !== $pinnedBy->id && $comment->user) {
            $comment->user->notify(new CommentPinnedNotification($post, $comment, $pinnedBy));
        }

        $comment->load(['user', 'replies.user']);

        return response()->json([
            'message' => 'Comment pinned.',
            'comment' => new CommentResource($comment),
        ]);
    }

    /**
     * Unpin the pinned comment on a post. Only the post author can unpin.
     */
    public function unpin(Request $request, Comment $comment): JsonResponse
    {
        $post = $comment->post;
        if ($request->user()->id !== $post->user_id) {
            return response()->json(['message' => 'Only the post author can unpin comments.'], 403);
        }

        $comment->update(['pinned_at' => null]);
        $comment->load(['user', 'replies.user']);

        return response()->json([
            'message' => 'Comment unpinned.',
            'comment' => new CommentResource($comment),
        ]);
    }

    /**
     * Collect all comment IDs from a tree of comments (any depth).
     *
     * @param iterable<\App\Models\Comment> $comments
     * @return array<int>
     */
    private function collectCommentIdsRecursive(iterable $comments): array
    {
        $ids = [];
        foreach ($comments as $c) {
            $ids[] = $c->id;
            $replies = $c->replies ?? [];
            if (!empty($replies)) {
                $ids = array_merge($ids, $this->collectCommentIdsRecursive($replies));
            }
        }
        return array_values(array_unique(array_filter($ids)));
    }

    /**
     * Set is_liked on each comment in the tree from a flat list of liked IDs.
     *
     * @param iterable<\App\Models\Comment> $comments
     * @param array<int> $likedCommentIds
     */
    private function setIsLikedRecursive(iterable $comments, array $likedCommentIds): void
    {
        foreach ($comments as $c) {
            $c->is_liked = in_array($c->id, $likedCommentIds);
            $replies = $c->replies ?? [];
            if (!empty($replies)) {
                $this->setIsLikedRecursive($replies, $likedCommentIds);
            }
        }
    }
}
