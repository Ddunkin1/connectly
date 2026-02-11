<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupConversation extends Model
{
    protected $fillable = ['name', 'created_by'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_conversation_members', 'group_conversation_id', 'user_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function groupMessages(): HasMany
    {
        return $this->hasMany(GroupMessage::class, 'group_conversation_id');
    }

    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }
}
