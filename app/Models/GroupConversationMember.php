<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class GroupConversationMember extends Pivot
{
    protected $table = 'group_conversation_members';

    protected $fillable = ['group_conversation_id', 'user_id', 'role', 'nickname'];

    public function groupConversation()
    {
        return $this->belongsTo(GroupConversation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
