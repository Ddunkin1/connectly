<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'parent_comment_id' => $this->parent_comment_id,
            'user' => new UserResource($this->whenLoaded('author')),
            'created_at' => $this->created_at,
            'hidden_at' => $this->hidden_at,
            'is_hidden' => $this->hidden_at !== null,
            'replies' => ProfileCommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
