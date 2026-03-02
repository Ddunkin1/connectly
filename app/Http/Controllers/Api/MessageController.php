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
                $url = $this->supabaseService->uploadFile($file, 'message-attachments');
                if ($url) {
                    $mime = $file->getMimeType();
                    $type = str_starts_with($mime, 'video/') ? 'video' : (str_starts_with($mime, 'image/') ? 'image' : 'file');
                    $options['attachment_url'] = $url;
                    $options['attachment_type'] = $type;
                }
            }

            $message = $this->messageService->sendMessage($conversation, $sender, $messageText, $options);

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
}
