<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupMessage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'group_conversation_id',
        'sender_id',
        'content',
        'attachment_url',
        'attachment_type',
        'edited_at',
        'deleted_by',
    ];

    protected $casts = [
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function groupConversation(): BelongsTo
    {
        return $this->belongsTo(GroupConversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
