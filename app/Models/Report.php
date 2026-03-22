<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Report extends Model
{
    /** Values must match frontend `REPORT_REASONS` and API validation. */
    public const REASONS = [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'sexual_content',
        'misinformation',
        'impersonation',
        'intellectual_property',
        'self_harm',
        'inappropriate',
        'other',
    ];

    /** Shown as “Priority” in admin UI; keep in sync with frontend `URGENT_REPORT_REASONS`. */
    public const URGENT_REASONS = ['violence', 'hate_speech', 'harassment'];

    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWED = 'reviewed';
    public const STATUS_DISMISSED = 'dismissed';
    public const STATUS_ACTION_TAKEN = 'action_taken';

    protected $fillable = [
        'reporter_id',
        'reportable_type',
        'reportable_id',
        'reason',
        'description',
        'status',
        'dismissal_reason',
        'dismissal_message',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }
}
