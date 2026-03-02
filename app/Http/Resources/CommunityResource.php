<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunityResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'avatar' => $this->avatar,
            'privacy' => $this->privacy,
            'requires_approval' => $this->requires_approval ?? false,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'members_count' => $this->whenCounted('members', fn() => $this->members()->count()),
            'is_member' => $this->is_member ?? false,
            'is_moderator' => $request->user() ? $this->resource->isModerator($request->user()) : false,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
