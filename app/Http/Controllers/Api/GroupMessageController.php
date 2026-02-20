<?php

namespace App\Http\Controllers\Api;

use App\Events\GroupMessageDeleted;
use App\Events\GroupMessageSent;
use App\Events\GroupMessageUpdated;
use App\Http\Requests\GroupMessage\StoreGroupMessageRequest;
use App\Http\Requests\GroupMessage\UpdateGroupMessageRequest;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupMessageResource;
use App\Models\GroupConversation;
use App\Models\GroupMessage;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupMessageController extends Controller
{
    public function __construct(
        private SupabaseService $supabaseService
    ) {
    }

    /**
     * Send a message to a group conversation.
     */
    public function store(StoreGroupMessageRequest $request): JsonResponse
    {
        $group = GroupConversation::findOrFail($request->validated('group_conversation_id'));

        if (!$group->isMember($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = [
            'group_conversation_id' => $group->id,
            'sender_id' => $request->user()->id,
            'content' => trim((string) ($request->validated('content') ?? '')),
        ];

        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $url = $this->supabaseService->uploadFile($file, 'group-message-attachments');
            if ($url) {
                $mime = $file->getMimeType();
                $type = str_starts_with((string) $mime, 'video/') ? 'video' : (str_starts_with((string) $mime, 'image/') ? 'image' : 'file');
                $data['attachment_url'] = $url;
                $data['attachment_type'] = $type;
            }
        }

        $message = GroupMessage::create($data);

        $message->load('sender');
        broadcast(new GroupMessageSent($message))->toOthers();

        return response()->json([
            'message' => (new GroupMessageResource($message))->resolve(),
        ], 201);
    }

    /**
     * Edit an existing group message sent by the authenticated user.
     */
    public function update(UpdateGroupMessageRequest $request, GroupMessage $groupMessage): JsonResponse
    {
        $groupMessage->load('groupConversation');
        $this->authorize('update', $groupMessage);

        $updated = DB::transaction(function () use ($request, $groupMessage) {
            $updates = [];
            $oldAttachmentUrl = $groupMessage->attachment_url;

            if ($request->has('content')) {
                $updates['content'] = trim((string) $request->input('content', ''));
            }

            if ($request->hasFile('media')) {
                $file = $request->file('media');
                $url = $this->supabaseService->uploadFile($file, 'group-message-attachments');
                $mime = $file->getMimeType();
                $type = str_starts_with((string) $mime, 'video/') ? 'video' : (str_starts_with((string) $mime, 'image/') ? 'image' : 'file');
                $updates['attachment_url'] = $url;
                $updates['attachment_type'] = $type;
            }

            $hasChanges = false;
            foreach ($updates as $field => $value) {
                if ($groupMessage->{$field} !== $value) {
                    $hasChanges = true;
                    break;
                }
            }

            if (! $hasChanges) {
                return $groupMessage->fresh('sender');
            }

            $updates['edited_at'] = now();
            $groupMessage->update($updates);

            if ($request->hasFile('media') && ! empty($oldAttachmentUrl) && $oldAttachmentUrl !== $groupMessage->attachment_url) {
                $this->supabaseService->deleteFile($oldAttachmentUrl);
            }

            return $groupMessage->fresh('sender');
        });
        broadcast(new GroupMessageUpdated($updated))->toOthers();

        return response()->json([
            'message' => 'Message updated successfully',
            'data' => (new GroupMessageResource($updated))->resolve(),
        ]);
    }

    /**
     * Soft-delete an existing group message sent by the authenticated user.
     */
    public function destroy(Request $request, GroupMessage $groupMessage): JsonResponse
    {
        $groupMessage->load('groupConversation');
        $this->authorize('delete', $groupMessage);

        $deleted = DB::transaction(function () use ($request, $groupMessage) {
            $oldAttachmentUrl = $groupMessage->attachment_url;
            $groupMessage->update([
                'content' => null,
                'attachment_url' => null,
                'attachment_type' => null,
                'deleted_by' => $request->user()->id,
            ]);
            $groupMessage->delete();

            if (! empty($oldAttachmentUrl)) {
                $this->supabaseService->deleteFile($oldAttachmentUrl);
            }

            return GroupMessage::withTrashed()->with('sender')->findOrFail($groupMessage->id);
        });
        broadcast(new GroupMessageDeleted($deleted))->toOthers();

        return response()->json([
            'message' => 'Message deleted successfully',
            'data' => (new GroupMessageResource($deleted))->resolve(),
        ]);
    }
}
