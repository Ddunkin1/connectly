<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();
        $otherUser = $currentUser ? $this->resource->getOtherUser($currentUser) : null;

        return [
            'id' => $this->id,
            'user_one' => new UserResource($this->whenLoaded('userOne')),
            'user_two' => new UserResource($this->whenLoaded('userTwo')),
            'other_user' => $otherUser ? new UserResource($otherUser) : null,
            'last_message' => $this->when(
                isset($this->resource->last_message) && $this->resource->last_message,
                fn () => new MessageResource($this->resource->last_message)
            ),
            'unread_count' => $this->when(
                isset($this->resource->unread_count),
                fn () => $this->resource->unread_count ?? ($currentUser ? $this->resource->getUnreadCountFor($currentUser) : 0)
            ),
            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
