<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProfileComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'author_id',
        'parent_comment_id',
        'content',
        'hidden_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'hidden_at' => 'datetime',
        ];
    }

    /**
     * The user whose profile this comment is on.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The user who wrote the comment.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Parent comment when this is a reply.
     */
    public function parentComment(): BelongsTo
    {
        return $this->belongsTo(ProfileComment::class, 'parent_comment_id');
    }

    /**
     * Replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(ProfileComment::class, 'parent_comment_id')->orderBy('created_at');
    }
}
