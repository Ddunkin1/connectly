<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Community extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'avatar',
        'creator_id',
        'privacy',
        'requires_approval',
    ];

    protected function casts(): array
    {
        return [
            'requires_approval' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($community) {
            if (empty($community->slug)) {
                $community->slug = Str::slug($community->name);
            }
        });
    }

    /**
     * Get the creator of the community.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get all members of the community.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function communityPosts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CommunityPost::class);
    }

    public function invites(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CommunityInvite::class);
    }

    public function joinRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CommunityJoinRequest::class);
    }

    public function isModerator(User $user): bool
    {
        return $user->isModerator()
            || $this->creator_id === $user->id
            || $this->members()->where('user_id', $user->id)->wherePivotIn('role', ['admin', 'moderator'])->exists();
    }
}
