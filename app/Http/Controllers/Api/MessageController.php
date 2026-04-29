<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageDeleted;
use App\Events\MessageUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Requests\Message\UpdateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\ConversationService;
use App\Services\MessageService;
use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MessageController extends Controller
{
    public function __construct(
        private ConversationService $conversationService,
        private MessageService $messageService,
        private SupabaseService $supabaseService
    ) {
    }

    /**
     * Send a message.
     *
     * @param StoreMessageRequest $request
     * @return JsonResponse
     */
    public function store(StoreMessageRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $sender = $request->user();
            $receiver = User::findOrFail($data['receiver_id']);

            // Get or create conversation
            $conversation = $this->conversationService->getOrCreateConversation($sender, $receiver);
            if (! $conversation) {
                return response()->json([
                    'message' => 'You cannot message this user.',
                ], 403);
            }

            $messageText = $data['message'] ?? '';
            $options = [];

            if ($request->hasFile('media')) {
                $file = $request->file('media');
                $mime = $file->getMimeType() ?? $file->getClientMimeType() ?? '';
                $type = str_starts_with($mime, 'video/') ? 'video' : (str_starts_with($mime, 'image/') ? 'image' : 'file');

                $url = null;
                try {
                    $url = $this->supabaseService->uploadFile($file, 'message-attachments');
                } catch (\Throwable $uploadErr) {
                    Log::warning('Supabase attachment upload failed; using local fallback.', [
                        'error' => $uploadErr->getMessage(),
                    ]);
                    $url = $this->storeAttachmentLocally($file);
                }

                if ($url) {
                    $options['attachment_url'] = $url;
                    $options['attachment_type'] = $type;
                }
            }

            if (!empty($data['post_id'])) {
                $options['post_id'] = (int) $data['post_id'];
            }

            $message = $this->messageService->sendMessage($conversation, $sender, $messageText, $options);

            // Unhide conversation for both users when a new message is sent
            $conversation->update(['hidden_by_user_one' => false, 'hidden_by_user_two' => false]);

            return response()->json([
                'message' => 'Message sent successfully',
                'data' => new MessageResource($message),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Message store failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $message = $e->getMessage();
            $isSupabase = str_contains($message, 'Supabase') || $e instanceof \RuntimeException;
            $status = $isSupabase ? 502 : 500;
            $userMessage = config('app.debug') ? $message : ($isSupabase ? 'File upload failed. Check your connection and try again.' : 'Failed to send message. Please try again.');
            return response()->json(['message' => $userMessage], $status);
        }
    }

    /**
     * Get messages for a conversation.
     *
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        // Verify user is a participant
        $conversation = $this->conversationService->getConversation($request->user(), $conversation->id);

        if (!$conversation) {
            return response()->json([
                'message' => 'Conversation not found or access denied',
            ], 404);
        }

        $perPage = min(max((int) $request->input('per_page', 25), 10), 50);
        $messages = $this->messageService->getMessages($conversation, $perPage);

        return response()->json([
            'messages' => MessageResource::collection($messages->items()),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Mark conversation messages as read.
     *
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function markAsRead(Request $request, Conversation $conversation): JsonResponse
    {
        // Verify user is a participant
        $conversation = $this->conversationService->getConversation($request->user(), $conversation->id);

        if (!$conversation) {
            return response()->json([
                'message' => 'Conversation not found or access denied',
            ], 404);
        }

        $this->messageService->markAsRead($conversation, $request->user());

        broadcast(new \App\Events\MessagesRead(
            conversationId: $conversation->id,
            readerId: $request->user()->id,
        ))->toOthers();

        return response()->json([
            'message' => 'Messages marked as read',
        ]);
    }

    /**
     * Get media (messages with attachments) for a conversation.
     */
    public function media(Request $request, Conversation $conversation): JsonResponse
    {
        $conversation = $this->conversationService->getConversation($request->user(), $conversation->id);

        if (! $conversation) {
            return response()->json(['message' => 'Conversation not found or access denied'], 404);
        }

        $messages = \App\Models\Message::where('conversation_id', $conversation->id)
            ->withTrashed()
            ->whereNotNull('attachment_url')
            ->orderBy('created_at', 'desc')
            ->paginate(24);

        return response()->json([
            'media' => MessageResource::collection($messages->items()),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Edit an existing message sent by the authenticated user.
     */
    public function update(UpdateMessageRequest $request, Message $message): JsonResponse
    {
        $this->authorize('update', $message);

        $validated = $request->validated();
        $updatedMessage = $this->messageService->updateMessage(
            $message,
            $validated['message'] ?? null,
            $request->file('media')
        );
        broadcast(new MessageUpdated($updatedMessage))->toOthers();

        return response()->json([
            'message' => 'Message updated successfully',
            'data' => new MessageResource($updatedMessage),
        ]);
    }

    /**
     * Soft-delete an existing message sent by the authenticated user.
     */
    public function destroy(Request $request, Message $message): JsonResponse
    {
        $this->authorize('delete', $message);

        $deletedMessage = $this->messageService->deleteMessage($message, $request->user());
        broadcast(new MessageDeleted($deletedMessage))->toOthers();

        return response()->json([
            'message' => 'Message deleted successfully',
            'data' => new MessageResource($deletedMessage),
        ]);
    }

    /**
     * Pin a message for all participants in the conversation.
     */
    public function pin(Request $request, Message $message): JsonResponse
    {
        $this->authorize('update', $message);

        $pinned = $this->messageService->pinMessage($message, $request->user());
        broadcast(new MessageUpdated($pinned))->toOthers();

        return response()->json([
            'message' => 'Message pinned successfully',
            'data' => new MessageResource($pinned),
        ]);
    }

    /**
     * Unpin a previously pinned message.
     */
    public function unpin(Request $request, Message $message): JsonResponse
    {
        $this->authorize('update', $message);

        $unpinned = $this->messageService->unpinMessage($message, $request->user());
        broadcast(new MessageUpdated($unpinned))->toOthers();

        return response()->json([
            'message' => 'Message unpinned successfully',
            'data' => new MessageResource($unpinned),
        ]);
    }

    private function storeAttachmentLocally(\Illuminate\Http\UploadedFile $file): ?string
    {
        try {
            $ext  = $file->getClientOriginalExtension() ?: 'bin';
            $name = uniqid('msg_', true) . '.' . $ext;
            $dest = storage_path('app/public/message-attachments/' . $name);

            if (! is_dir(dirname($dest))) {
                mkdir(dirname($dest), 0755, true);
            }

            if (! copy($file->getRealPath(), $dest)) {
                return null;
            }

            return rtrim(config('app.url'), '/') . '/api/local-media/message-attachments/' . $name;
        } catch (\Throwable $e) {
            Log::error('Local message attachment fallback failed.', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
