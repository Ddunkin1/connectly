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
        $otherUser = $this->getOtherUser($currentUser);

        return [
            'id' => $this->id,
            'user_one' => new UserResource($this->whenLoaded('userOne')),
            'user_two' => new UserResource($this->whenLoaded('userTwo')),
            'other_user' => new UserResource($otherUser),
            'last_message' => $this->when(
                isset($this->last_message) && $this->last_message,
                fn() => new MessageResource($this->last_message)
            ),
            'unread_count' => $this->when(
                isset($this->unread_count),
                fn() => $this->unread_count ?? $this->getUnreadCountFor($currentUser)
            ),
            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
