<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ModerationEvent extends Model
{
    public const ACTION_WARNING = 'warning';

    public const ACTION_SUSPEND = 'suspend';

    public const ACTION_BAN = 'ban';

    public const ACTION_UNBAN = 'unban';

    protected $fillable = [
        'user_id',
        'admin_id',
        'action',
        'reason_code',
        'message',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function warningAppeal(): HasOne
    {
        return $this->hasOne(WarningAppeal::class, 'moderation_event_id');
    }

    public function banAppeal(): HasOne
    {
        return $this->hasOne(BanAppeal::class, 'moderation_event_id');
    }
}
