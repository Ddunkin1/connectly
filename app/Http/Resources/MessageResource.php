<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        $isDeleted = ! is_null($this->deleted_at);
        $isOwner = $currentUserId && (int) $currentUserId === (int) $this->sender_id;

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'receiver' => new UserResource($this->whenLoaded('receiver')),
            'message' => $this->message,
            'type' => $this->type,
            'attachment_url' => $isDeleted ? null : $this->attachment_url,
            'attachment_type' => $isDeleted ? null : $this->attachment_type,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at,
            'edited_at' => $this->edited_at,
            'is_deleted' => $isDeleted,
            'deleted_at' => $this->deleted_at,
            'deleted_by' => $this->deleted_by,
            'is_pinned' => (bool) $this->is_pinned,
            'pinned_at' => $this->pinned_at,
            'can_edit' => $isOwner && ! $isDeleted,
            'can_delete' => $isOwner && ! $isDeleted,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
