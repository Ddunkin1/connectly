<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Services\ConversationService;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(
        private ConversationService $conversationService,
        private MessageService $messageService
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
        $data = $request->validated();
        $sender = $request->user();
        $receiver = \App\Models\User::findOrFail($data['receiver_id']);

        // Get or create conversation
        $conversation = $this->conversationService->getOrCreateConversation($sender, $receiver);

        // Send message
        $message = $this->messageService->sendMessage($conversation, $sender, $data['message']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => new MessageResource($message),
        ], 201);
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

        $messages = $this->messageService->getMessages($conversation, 50);

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
}
