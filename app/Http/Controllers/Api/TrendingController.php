<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Hashtag;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrendingController extends Controller
{
    /**
     * Get posts for a specific hashtag (paginated).
     */
    public function hashtagPosts(Request $request): JsonResponse
    {
        $tag = trim((string) $request->input('tag', ''));

        if ($tag === '') {
            return response()->json(['message' => 'tag parameter is required'], 422);
        }

        $hashtag = Hashtag::where('name', $tag)
            ->orWhere('slug', \Illuminate\Support\Str::slug($tag))
            ->first();

        if (!$hashtag) {
            return response()->json(['posts' => [], 'hashtag' => null, 'total' => 0]);
        }

        $user = $request->user();
        $blockedIds = $user
            ? array_merge($user->blockedUserIds(), $user->blockedByUserIds())
            : [];

        $posts = $hashtag->posts()
            ->with(['user', 'hashtags', 'sharedPost.user', 'poll.options'])
            ->withCount(['likes', 'allComments'])
            ->when(!empty($blockedIds), fn ($q) => $q->whereNotIn('user_id', $blockedIds))
            ->where('visibility', 'public')
            ->where('is_archived', false)
            ->orderByDesc('posts.created_at')
            ->paginate(15);

        return response()->json([
            'hashtag' => ['id' => $hashtag->id, 'name' => $hashtag->name],
            'posts'   => PostResource::collection($posts->items()),
            'total'   => $posts->total(),
            'page'    => $posts->currentPage(),
            'last_page' => $posts->lastPage(),
        ]);
    }

    /**
     * Get trending hashtags (by post count in last 48 hours).
     */
    public function hashtags(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 10), 50);
        $hours = min((int) $request->input('hours', 48), 168);

        $since = now()->subHours($hours);

        $hashtags = Hashtag::whereHas('posts', function ($q) use ($since) {
            $q->where('posts.created_at', '>=', $since);
        })
            ->withCount(['posts' => function ($q) use ($since) {
                $q->where('posts.created_at', '>=', $since);
            }])
            ->orderByDesc('posts_count')
            ->limit($limit)
            ->get()
            ->map(fn ($h) => ['id' => $h->id, 'name' => $h->name, 'posts_count' => $h->posts_count]);

        return response()->json(['hashtags' => $hashtags]);
    }

    /**
     * Get trending posts (by engagement in last 24-48 hours).
     */
    public function posts(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 15), 50);
        $hours = min((int) $request->input('hours', 48), 168);

        $since = now()->subHours($hours);

        $postIds = Post::where('created_at', '>=', $since)
            ->where('is_archived', false)
            ->whereIn('visibility', ['public'])
            ->pluck('id');

        if ($postIds->isEmpty()) {
            return response()->json(['posts' => []]);
        }

        $engagement = Like::where('likeable_type', Post::class)
            ->whereIn('likeable_id', $postIds)
            ->where('created_at', '>=', $since)
            ->selectRaw('likeable_id as post_id, COUNT(*) as likes_count')
            ->groupBy('likeable_id')
            ->pluck('likes_count', 'post_id');

        $commentsCount = DB::table('comments')
            ->whereIn('post_id', $postIds)
            ->where('created_at', '>=', $since)
            ->selectRaw('post_id, COUNT(*) as c')
            ->groupBy('post_id')
            ->pluck('c', 'post_id');

        $scores = [];
        foreach ($postIds as $id) {
            $scores[$id] = ($engagement[$id] ?? 0) * 1 + ($commentsCount[$id] ?? 0) * 2;
        }
        arsort($scores);
        $topIds = array_slice(array_keys($scores), 0, $limit);

        if (empty($topIds)) {
            return response()->json(['posts' => []]);
        }

        $posts = Post::with(['user', 'hashtags', 'sharedPost.user', 'poll.options'])
            ->whereIn('id', $topIds)
            ->orderByRaw('FIELD(id, ' . implode(',', array_map('intval', $topIds)) . ')')
            ->get();

        return response()->json([
            'posts' => PostResource::collection($posts),
        ]);
    }
}
