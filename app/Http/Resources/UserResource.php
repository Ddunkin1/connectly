<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'username' => $this->username,
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            'bio' => $this->bio,
            'profile_picture' => $this->profile_picture ? asset('storage/' . $this->profile_picture) : null,
            'location' => $this->location,
            'website' => $this->website,
            'privacy_settings' => $this->privacy_settings,
            'followers_count' => $this->whenCounted('followers'),
            'following_count' => $this->whenCounted('following'),
            'is_following' => $this->when(
                $request->user(),
                fn() => $request->user()->isFollowing($this->resource)
            ),
            'created_at' => $this->created_at,
        ];
    }
}
