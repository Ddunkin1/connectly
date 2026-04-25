<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\FriendRequest;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use CanResetPassword, HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MODERATOR = 'moderator';
    public const ROLE_USER = 'user';

    protected $fillable = [
        'name',
        'email',
        'username',
        'role',
        'password',
        'provider',
        'provider_id',
        'bio',
        'profile_picture',
        'profile_picture_caption',
        'profile_picture_visibility',
        'cover_image',
        'cover_image_caption',
        'cover_image_visibility',
        'latest_profile_picture_post_id',
        'latest_cover_image_post_id',
        'location',
        'website',
        'privacy_settings',
        'notification_preferences',
        'onboarding_completed',
        'suspended_at',
        'suspended_until',
        'banned_at',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'suspended_at' => 'datetime',
            'suspended_until' => 'datetime',
            'banned_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'array',
            'two_factor_recovery_codes' => 'array',
            'two_factor_confirmed_at' => 'datetime',
            'muted_topics' => 'array',
            'muted_users' => 'array',
            'muted_communities' => 'array',
            'onboarding_completed' => 'boolean',
        ];
    }

    /**
     * Default notification preferences.
     */
    /**
     * Check if two-factor authentication is enabled.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return !empty($this->two_factor_secret) && !empty($this->two_factor_confirmed_at);
    }

    public static function defaultNotificationPreferences(): array
    {
        return [
            'likes' => true,
            'comments' => true,
            'follows' => true,
            'mentions' => true,
            'messages' => true,
        ];
    }

    /**
     * Get all posts created by the user.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Latest post created when the user updated their profile picture.
     */
    public function latestProfilePicturePost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'latest_profile_picture_post_id');
    }

    /**
     * Latest post created when the user updated their cover image.
     */
    public function latestCoverImagePost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'latest_cover_image_post_id');
    }

    /**
     * Get all stories for this user.
     */
    public function stories(): HasMany
    {
        return $this->hasMany(Story::class);
    }

    /**
     * Get all comments made by the user.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get all comments left on this user's profile.
     */
    public function profileComments(): HasMany
    {
        return $this->hasMany(ProfileComment::class);
    }

    /**
     * Get all likes made by the user.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get all users this user is following.
     */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
            ->withTimestamps();
    }

    /**
     * Get all users following this user.
     */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
            ->withTimestamps();
    }

    /**
     * Get all communities the user is a member of.
     */
    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(Community::class, 'community_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Check if user is following another user.
     */
    public function isFollowing(User $user): bool
    {
        return $this->following()->where('following_id', $user->id)->exists();
    }

    /**
     * Check if user is followed by another user.
     */
    public function isFollowedBy(User $user): bool
    {
        return $this->followers()->where('follower_id', $user->id)->exists();
    }

    /**
     * Get followers count.
     */
    public function followersCount(): int
    {
        return $this->followers()->count();
    }

    /**
     * Get following count.
     */
    public function followingCount(): int
    {
        return $this->following()->count();
    }

    /**
     * Get conversations where user is user_one.
     */
    public function conversationsAsUserOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    /**
     * Get conversations where user is user_two.
     */
    public function conversationsAsUserTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    /**
     * Get all conversations for this user (merged user_one and user_two).
     */
    public function conversations()
    {
        return Conversation::forUser($this);
    }

    /**
     * Get all messages sent by this user.
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get all messages received by this user.
     */
    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    /**
     * Get count of unread messages for this user.
     */
    public function unreadMessagesCount(): int
    {
        return Message::where('receiver_id', $this->id)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get friend requests sent by this user.
     */
    public function sentFriendRequests(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'sender_id');
    }

    /**
     * Get friend requests received by this user.
     */
    public function receivedFriendRequests(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'receiver_id');
    }

    /**
     * Get pending friend requests received by this user.
     */
    public function pendingFriendRequests(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'receiver_id')
            ->where('status', 'pending');
    }

    /**
     * Check if user has a pending friend request with another user.
     */
    public function hasPendingFriendRequestWith(User $user): bool
    {
        return FriendRequest::where(function ($query) use ($user) {
            $query->where('sender_id', $this->id)
                  ->where('receiver_id', $user->id)
                  ->where('status', 'pending');
        })->orWhere(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', $this->id)
                  ->where('status', 'pending');
        })->exists();
    }

    /**
     * Check if this user and the given user are friends (accepted friend request).
     */
    public function isFriendWith(User $user): bool
    {
        if ($this->id === $user->id) {
            return false;
        }
        return FriendRequest::where('status', 'accepted')
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $this->id)->where('receiver_id', $user->id)
                    ->orWhere('sender_id', $user->id)->where('receiver_id', $this->id);
            })
            ->exists();
    }

    /**
     * Get posts bookmarked by this user.
     */
    public function bookmarkedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'bookmarks')
            ->withTimestamps();
    }

    /**
     * Get users blocked by this user.
     */
    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    /**
     * Get users who have blocked this user.
     */
    public function blockedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    /**
     * Check if this user has blocked another user.
     */
    public function hasBlocked(User $user): bool
    {
        return $this->blockedUsers()->where('blocked_id', $user->id)->exists();
    }

    /**
     * Check if this user is blocked by another user.
     */
    public function isBlockedBy(User $user): bool
    {
        return $this->blockedBy()->where('blocker_id', $user->id)->exists();
    }

    /**
     * Get IDs of users this user has blocked.
     */
    public function blockedUserIds(): array
    {
        return $this->blockedUsers()->pluck('blocked_id')->toArray();
    }

    /**
     * Get IDs of users who have blocked this user.
     */
    public function blockedByUserIds(): array
    {
        return $this->blockedBy()->pluck('blocker_id')->toArray();
    }

    /**
     * Get group conversations the user is in.
     */
    public function groupConversations(): BelongsToMany
    {
        return $this->belongsToMany(GroupConversation::class, 'group_conversation_members', 'user_id', 'group_conversation_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get all reports for this user.
     */
    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    /**
     * Moderation history (warnings, suspensions logged as events, etc.).
     */
    public function moderationEvents(): HasMany
    {
        return $this->hasMany(ModerationEvent::class);
    }

    public function isBanned(): bool
    {
        return $this->banned_at !== null;
    }

    /**
     * Check if user is suspended.
     */
    /**
     * Suspended when suspended_at is set and either indefinite (no end) or end is in the future.
     */
    public function isSuspended(): bool
    {
        if ($this->suspended_at === null) {
            return false;
        }
        if ($this->suspended_until !== null && now()->greaterThanOrEqualTo($this->suspended_until)) {
            return false;
        }

        return true;
    }

    /**
     * Clear expired timed suspension (call on login / token refresh).
     */
    public function clearExpiredSuspensionIfNeeded(): void
    {
        if ($this->suspended_at === null) {
            return;
        }
        if ($this->suspended_until !== null && now()->greaterThanOrEqualTo($this->suspended_until)) {
            $this->forceFill([
                'suspended_at' => null,
                'suspended_until' => null,
            ])->save();
        }
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Check if user is a moderator or admin.
     */
    public function isModerator(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_MODERATOR], true);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'username';
    }

    /**
     * Retrieve the model for a bound value (supports username or numeric id).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $query = static::query();

        if ($field !== null) {
            return $query->where($field, $value)->firstOrFail();
        }

        if (is_numeric($value)) {
            return $query->where('id', $value)->firstOrFail();
        }

        return $query->where($this->getRouteKeyName(), $value)->firstOrFail();
    }
}
