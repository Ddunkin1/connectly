<?php

namespace App\Http\Resources;

use App\Models\FriendRequest;
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
        $currentUser = $request->user();
        $friendRequestStatus = null;
        
        if ($currentUser && $currentUser->id !== $this->id) {
            // Check for pending friend request
            $sentRequest = FriendRequest::where('sender_id', $currentUser->id)
                ->where('receiver_id', $this->id)
                ->where('status', 'pending')
                ->first();
            
            $receivedRequest = FriendRequest::where('sender_id', $this->id)
                ->where('receiver_id', $currentUser->id)
                ->where('status', 'pending')
                ->first();
            
            if ($sentRequest) {
                $friendRequestStatus = 'sent';
            } elseif ($receivedRequest) {
                $friendRequestStatus = 'received';
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            'bio' => $this->bio,
            'profile_picture' => $this->profile_picture ? (filter_var($this->profile_picture, FILTER_VALIDATE_URL) ? $this->profile_picture : asset('storage/' . $this->profile_picture)) : null,
            'cover_image' => $this->cover_image ? (filter_var($this->cover_image, FILTER_VALIDATE_URL) ? $this->cover_image : asset('storage/' . $this->cover_image)) : null,
            'location' => $this->location,
            'website' => $this->website,
            'privacy_settings' => $this->privacy_settings,
            'followers_count' => $this->whenCounted('followers'),
            'following_count' => $this->whenCounted('following'),
            'is_following' => $this->when(
                $request->user(),
                fn() => $request->user()->isFollowing($this->resource)
            ),
            'friend_request_status' => $friendRequestStatus,
            'created_at' => $this->created_at,
        ];
    }
}
