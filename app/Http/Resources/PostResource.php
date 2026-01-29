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
            'user' => new UserResource($this->whenLoaded('user')),
            'likes_count' => $this->whenCounted('likes', fn() => $this->likes()->count()),
            'comments_count' => $this->whenCounted('allComments', fn() => $this->allComments()->count()),
            'shares_count' => $this->shares_count ?? 0,
            'is_liked' => $this->when(
                $request->user(),
                fn() => $this->isLikedBy($request->user())
            ),
            'hashtags' => HashtagResource::collection($this->whenLoaded('hashtags')),
            'shared_post' => new PostResource($this->whenLoaded('sharedPost')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
