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
            'content' => $this->content,
            'media_url' => $this->media_url,
            'media_type' => $this->media_type,
            'visibility' => $this->visibility,
            'user' => new UserResource($this->whenLoaded('user')),
            'likes_count' => $this->whenCounted('likes', fn() => $this->likes()->count()),
            'comments_count' => $this->whenCounted('allComments', fn() => $this->allComments()->count()),
            'is_liked' => $this->when(
                $request->user(),
                fn() => $this->isLikedBy($request->user())
            ),
            'hashtags' => HashtagResource::collection($this->whenLoaded('hashtags')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
