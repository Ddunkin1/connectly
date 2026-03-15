<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityInvite extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PENDING_APPROVAL = 'pending_approval';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'community_id',
        'invited_user_id',
        'inviter_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function invitedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    public function isDirectInvite(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPendingApproval(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }
}
