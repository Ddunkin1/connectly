<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'media_url',
        'media_type',
        'visibility',
        'is_archived',
        'shares_count',
        'shared_post_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'is_archived' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the post.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the original post when this post is a share/repost.
     */
    public function sharedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'shared_post_id');
    }

    /**
     * Get shares of this post.
     */
    public function shares(): HasMany
    {
        return $this->hasMany(Post::class, 'shared_post_id');
    }

    /**
     * Get all comments for the post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_comment_id');
    }

    /**
     * Get all comments including nested replies.
     */
    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get all likes for the post.
     */
    public function likes(): MorphMany
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    /**
     * Get all hashtags for the post.
     */
    public function hashtags(): BelongsToMany
    {
        return $this->belongsToMany(Hashtag::class, 'post_hashtag');
    }

    /**
     * Check if a user has liked this post.
     */
    public function isLikedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }

    /**
     * Get the count of likes.
     */
    public function likesCount(): int
    {
        return $this->likes()->count();
    }

    /**
     * Get the count of comments.
     */
    public function commentsCount(): int
    {
        return $this->allComments()->count();
    }
}
