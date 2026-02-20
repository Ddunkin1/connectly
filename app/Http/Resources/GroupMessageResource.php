<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()?->id;
        $isDeleted = ! is_null($this->deleted_at);
        $isOwner = $currentUserId && (int) $currentUserId === (int) $this->sender_id;

        return [
            'id' => $this->id,
            'group_conversation_id' => $this->group_conversation_id,
            'sender_id' => $this->sender_id,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'content' => $this->content,
            'attachment_url' => $isDeleted ? null : $this->attachment_url,
            'attachment_type' => $isDeleted ? null : $this->attachment_type,
            'edited_at' => $this->edited_at,
            'is_deleted' => $isDeleted,
            'deleted_at' => $this->deleted_at,
            'deleted_by' => $this->deleted_by,
            'can_edit' => $isOwner && ! $isDeleted,
            'can_delete' => $isOwner && ! $isDeleted,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
