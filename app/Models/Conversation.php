<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the first user in the conversation.
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * Get the second user in the conversation.
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Get all messages in the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->withTrashed()->orderBy('created_at', 'desc');
    }

    /**
     * Get the other user in the conversation.
     */
    public function getOtherUser(User $user): User
    {
        return $this->user_one_id === $user->id ? $this->userTwo : $this->userOne;
    }

    /**
     * Get the most recent message in the conversation.
     */
    public function getLastMessage(): ?Message
    {
        return $this->messages()->first();
    }

    /**
     * Mark all messages as read for a specific user.
     */
    public function markAsReadFor(User $user): void
    {
        $this->messages()
            ->where('receiver_id', $user->id)
            ->whereNull('deleted_at')
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Get unread messages count for a specific user.
     */
    public function getUnreadCountFor(User $user): int
    {
        return $this->messages()
            ->where('receiver_id', $user->id)
            ->whereNull('deleted_at')
            ->where('is_read', false)
            ->count();
    }

    /**
     * Scope to get conversations for a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('user_one_id', $user->id)
              ->orWhere('user_two_id', $user->id);
        });
    }
}
