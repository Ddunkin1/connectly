<?php

namespace App\Http\Resources;

use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;

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

        // is_following = following in follows table OR accepted friend request (handles sync edge cases)
        $isConnected = $currentUser && $currentUser->id !== $this->id && (
            $currentUser->isFollowing($this->resource) ||
            FriendRequest::where('status', 'accepted')
                ->where(function ($q) use ($currentUser) {
                    $q->where('sender_id', $currentUser->id)->where('receiver_id', $this->id)
                        ->orWhere('sender_id', $this->id)->where('receiver_id', $currentUser->id);
                })
                ->exists()
        );

        $isBlocked = $currentUser && $currentUser->id !== $this->id && $currentUser->hasBlocked($this->resource);
        $hasBlockedYou = $currentUser && $currentUser->id !== $this->id && $this->resource->hasBlocked($currentUser);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            // Login/register run without auth context; still expose own role so SPA can route admins.
            'role' => $this->when(
                $currentUser?->isAdmin()
                || $currentUser?->id === $this->id
                || $this->shouldExposeRoleForLoginOrRegisterResponse($request),
                $this->role
            ),
            'suspended_at' => $this->when($currentUser?->isAdmin(), $this->suspended_at),
            'suspended_until' => $this->when($currentUser?->isAdmin(), $this->suspended_until),
            'banned_at' => $this->when($currentUser?->isAdmin(), $this->banned_at),
            'is_blocked' => $this->when($currentUser && $currentUser->id !== $this->id, $isBlocked ?? false),
            'has_blocked_you' => $this->when($currentUser && $currentUser->id !== $this->id, $hasBlockedYou ?? false),
            'email' => $this->when(
                $request->user()?->id === $this->id || $request->user()?->isAdmin(),
                $this->email
            ),
            'bio' => $this->bio,
            'profile_picture' => $this->formatProfilePictureUrl($request),
            'profile_picture_caption' => $this->profile_picture_caption,
            'profile_picture_visibility' => $this->profile_picture_visibility ?? 'public',
            'cover_image' => $this->formatCoverImageUrl($request),
            'cover_image_caption' => $this->cover_image_caption,
            'cover_image_visibility' => $this->cover_image_visibility ?? 'public',
            'location' => $this->location,
            'website' => $this->website,
            'privacy_settings' => $this->privacy_settings,
            'followers_count' => $this->whenCounted('followers'),
            'following_count' => $this->whenCounted('following'),
            'posts_count' => $this->whenCounted('posts'),
            'is_following' => $this->when($request->user(), $isConnected ?? false),
            'friend_request_status' => $friendRequestStatus,
            'email_verified_at' => $this->when($request->user()?->id === $this->id, $this->email_verified_at),
            'created_at' => $this->created_at,
            'latest_profile_picture_post' => new PostResource($this->whenLoaded('latestProfilePicturePost')),
            'latest_cover_image_post' => new PostResource($this->whenLoaded('latestCoverImagePost')),
        ];
    }

    /**
     * POST /login and POST /register return UserResource before the client sends Bearer token;
     * $request->user() is null, so we still include role for the signed-in/registered user only.
     */
    private function shouldExposeRoleForLoginOrRegisterResponse(Request $request): bool
    {
        if ($request->user() !== null) {
            return false;
        }

        return $request->is('api/login', 'api/register', 'login', 'register');
    }

    /**
     * Format profile_picture URL: use proxy for Supabase URLs (avoids 403), otherwise asset URL.
     * Appends ?v= hash so the URL changes when the image changes (avoids browser showing cached old image).
     */
    private function formatProfilePictureUrl(Request $request): ?string
    {
        $picture = $this->profile_picture;
        if (empty($picture)) {
            return null;
        }
        $visibility = $this->profile_picture_visibility ?? 'public';
        if ($visibility === 'friends') {
            $currentUser = $request->user();
            if (!$currentUser || $currentUser->id === $this->id) {
                // Owner always sees their own
            } elseif (!$this->resource->isFriendWith($currentUser)) {
                return null;
            }
        }
        $isSupabase = str_contains($picture, 'supabase.co');
        if ($isSupabase) {
            return $this->buildProxyUrl($request, 'profile-picture', md5($picture));
        }
        return filter_var($picture, FILTER_VALIDATE_URL) ? $picture : asset('storage/' . $picture);
    }

    /**
     * Format cover_image URL: use proxy for Supabase URLs (avoids 403), otherwise asset URL.
     */
    private function formatCoverImageUrl(Request $request): ?string
    {
        $cover = $this->cover_image;
        if (empty($cover)) {
            return null;
        }
        $visibility = $this->cover_image_visibility ?? 'public';
        if ($visibility === 'friends') {
            $currentUser = $request->user();
            if (!$currentUser || $currentUser->id === $this->id) {
                // Owner always sees their own
            } elseif (!$this->resource->isFriendWith($currentUser)) {
                return null;
            }
        }

        // Any Supabase storage URL (including signed URLs with tokens) should use our proxy
        $isSupabase = str_contains($cover, 'supabase.co');
        if ($isSupabase) {
            $proxyUrl = $this->buildProxyUrl($request, 'cover-image', md5($cover));
            if (config('app.debug')) {
                Log::debug('formatCoverImageUrl', [
                    'stored_cover' => substr($cover, 0, 80) . '...',
                    'proxy_url' => $proxyUrl,
                ]);
            }
            return $proxyUrl;
        }

        return filter_var($cover, FILTER_VALIDATE_URL) ? $cover : asset('storage/' . $cover);
    }

    /**
     * Build proxy URL for user images (cover or profile picture).
     * Optional $version (e.g. hash of stored URL) is appended as ?v= to bust cache when image changes.
     */
    private function buildProxyUrl(Request $request, string $type, ?string $version = null): string
    {
        $base = config('services.supabase.cover_proxy_base')
            ?: $request->getSchemeAndHttpHost()
            ?: rtrim(config('app.url'), '/');
        $url = rtrim($base, '/') . '/api/users/' . $this->username . '/' . $type;
        if ($version !== null && $version !== '') {
            $url .= '?v=' . $version;
        }
        return $url;
    }
}
