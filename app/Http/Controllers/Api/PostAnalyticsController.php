<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use App\Models\PostView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostAnalyticsController extends Controller
{
    public function recordView(Request $request, Post $post): JsonResponse
    {
        try {
            $userId = $request->user()?->id;

            // Don't count the author's own views
            if ($userId && $userId === $post->user_id) {
                return response()->json(['ok' => true]);
            }

            // One view per user (or IP for guests) per post per hour
            $exists = PostView::where('post_id', $post->id)
                ->where('viewed_at', '>=', now()->subHour())
                ->when(
                    $userId,
                    fn ($q) => $q->where('user_id', $userId),
                    fn ($q) => $q->whereNull('user_id')->where('viewer_ip', $request->ip())
                )
                ->exists();

            if (! $exists) {
                PostView::create([
                    'post_id'   => $post->id,
                    'user_id'   => $userId,
                    'viewer_ip' => $userId ? null : $request->ip(),
                    'viewed_at' => now(),
                ]);
            }
        } catch (\Throwable) {
            // Table may not exist yet (migration pending) — never surface this as an error
        }

        return response()->json(['ok' => true]);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        if ($request->user()->id !== $post->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $views          = PostView::where('post_id', $post->id)->count();
        $uniqueViewers  = PostView::where('post_id', $post->id)->whereNotNull('user_id')->distinct('user_id')->count('user_id');
        $likes          = $post->likes()->count();
        $comments       = Comment::where('post_id', $post->id)->count();
        $shares         = $post->shares()->count();
        $engagementRate = $views > 0 ? round(($likes + $comments + $shares) / $views * 100, 1) : 0;

        $startDate = now()->subDays(6)->startOfDay();
        $days      = collect(range(6, 0))->map(fn ($i) => now()->subDays($i)->format('Y-m-d'));

        $dailyViews = PostView::where('post_id', $post->id)
            ->where('viewed_at', '>=', $startDate)
            ->selectRaw('DATE(viewed_at) as date, COUNT(*) as cnt')
            ->groupBy('date')
            ->pluck('cnt', 'date');

        $dailyLikes = Like::where('likeable_type', Post::class)
            ->where('likeable_id', $post->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as cnt')
            ->groupBy('date')
            ->pluck('cnt', 'date');

        $dailyComments = Comment::where('post_id', $post->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as cnt')
            ->groupBy('date')
            ->pluck('cnt', 'date');

        $daily = $days->map(fn ($date) => [
            'date'     => $date,
            'views'    => (int) ($dailyViews[$date]    ?? 0),
            'likes'    => (int) ($dailyLikes[$date]    ?? 0),
            'comments' => (int) ($dailyComments[$date] ?? 0),
        ])->values();

        $peakDay = $daily->sortByDesc('views')->first();

        return response()->json([
            'summary' => [
                'views'           => $views,
                'unique_viewers'  => $uniqueViewers,
                'likes'           => $likes,
                'comments'        => $comments,
                'shares'          => $shares,
                'engagement_rate' => $engagementRate,
            ],
            'daily'    => $daily,
            'peak_day' => $peakDay,
            'post'     => [
                'id'              => $post->id,
                'content_preview' => mb_substr((string) $post->content, 0, 120),
                'media_type'      => $post->media_type,
                'media_url'       => $post->media_url,
                'created_at'      => $post->created_at?->toIso8601String(),
            ],
        ]);
    }
}
