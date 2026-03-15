<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'user' => new UserResource($this->whenLoaded('user')),
            'parent_comment_id' => $this->parent_comment_id,
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            'replies_count' => $this->whenCounted('replies'),
            'likes_count' => $this->whenCounted('likes', fn() => $this->likes()->count()),
            'is_liked' => $this->when(
                $request->user(),
                fn() => $this->isLikedBy($request->user())
            ),
            'created_at' => $this->created_at,
        ];
    }
}
