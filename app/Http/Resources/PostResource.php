<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content ?? '', // Handle NULL content (for media-only posts)
            'media_url' => $this->media_url, // Supabase URLs are already full URLs
            'media_type' => $this->media_type,
            'visibility' => $this->visibility,
            'is_archived' => (bool) ($this->is_archived ?? false),
            'user' => new UserResource($this->whenLoaded('user')),
            'likes_count' => $this->when(isset($this->likes_count), (int) $this->likes_count, fn () => $this->likes()->count()),
            'comments_count' => $this->when(isset($this->all_comments_count), (int) $this->all_comments_count, fn () => $this->allComments()->count()),
            'shares_count' => $this->shares_count ?? 0,
            'is_liked' => $this->when(
                $request->user(),
                fn () => isset($this->is_liked) ? (bool) $this->is_liked : $this->isLikedBy($request->user())
            ),
            'is_bookmarked' => $this->when(
                $request->user() && isset($this->is_bookmarked),
                fn () => (bool) $this->is_bookmarked
            ),
            'hashtags' => HashtagResource::collection($this->whenLoaded('hashtags')),
            'shared_post' => new PostResource($this->whenLoaded('sharedPost')),
            'poll' => $this->when($this->relationLoaded('poll') && $this->poll, function () use ($request) {
                $poll = $this->poll;
                $voteCounts = \App\Models\PollVote::where('poll_id', $poll->id)
                    ->selectRaw('poll_option_id, count(*) as cnt')
                    ->groupBy('poll_option_id')
                    ->pluck('cnt', 'poll_option_id');
                $options = $poll->options->map(function ($opt) use ($voteCounts) {
                    $count = (int) ($voteCounts[$opt->id] ?? 0);
                    return [
                        'id' => $opt->id,
                        'text' => $opt->text,
                        'votes_count' => $count,
                    ];
                });
                $totalVotes = $options->sum('votes_count');
                $userVote = $request->user()
                    ? \App\Models\PollVote::where('poll_id', $poll->id)->where('user_id', $request->user()->id)->first()
                    : null;
                return [
                    'id' => $poll->id,
                    'question' => $poll->question,
                    'options' => $options->map(fn ($o) => array_merge($o, [
                        'percentage' => $totalVotes > 0 ? round(($o['votes_count'] / $totalVotes) * 100) : 0,
                    ]))->values(),
                    'total_votes' => $totalVotes,
                    'user_voted_option_id' => $userVote?->poll_option_id,
                ];
            }),
            'recent_likers' => UserResource::collection($this->recent_likers ?? collect()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
