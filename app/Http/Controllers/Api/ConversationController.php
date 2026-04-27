<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Services\ConversationService;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(
        private ConversationService $conversationService,
        private MessageService $messageService
    ) {
    }

    /**
     * Get all conversations for the authenticated user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $conversations = $this->conversationService->getUserConversations($request->user(), 20);

        return response()->json([
            'conversations' => ConversationResource::collection($conversations->items()),
            'pagination' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    /**
     * Get a specific conversation with messages.
     *
     * @param Request $request
     * @param Conversation $conversation
     * @return JsonResponse
     */
    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        // Verify user is a participant
        $conversation = $this->conversationService->getConversation($request->user(), $conversation->id);

        if (!$conversation) {
            return response()->json([
                'message' => 'Conversation not found or access denied',
            ], 404);
        }

        // Mark messages as read when viewing conversation
        $this->messageService->markAsRead($conversation, $request->user());

        // Load messages
        $messages = $this->messageService->getMessages($conversation, 50);

        return response()->json([
            'conversation' => new ConversationResource($conversation),
            'messages' => \App\Http\Resources\MessageResource::collection($messages->items()),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Get or create a conversation by username.
     *
     * @param Request $request
     * @param string $username
     * @return JsonResponse
     */
    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if ($conversation->user_one_id !== $user->id && $conversation->user_two_id !== $user->id) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        if ($conversation->user_one_id === $user->id) {
            $conversation->update(['hidden_by_user_one' => true]);
        } else {
            $conversation->update(['hidden_by_user_two' => true]);
        }

        return response()->json(['message' => 'Conversation deleted']);
    }

    public function getByUsername(Request $request, string $username): JsonResponse
    {
        $currentUser = $request->user();

        // Find the user by username
        $otherUser = \App\Models\User::where('username', $username)->first();

        if (!$otherUser) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        // Check block status (skip for self-conversations)
        if ($currentUser->id !== $otherUser->id) {
            if ($currentUser->hasBlocked($otherUser)) {
                return response()->json([
                    'message' => 'You cannot message a user you have blocked',
                ], 403);
            }
            if ($otherUser->hasBlocked($currentUser)) {
                return response()->json([
                    'message' => 'You cannot message this user',
                ], 403);
            }
        }

        // Get or create conversation
        $conversation = $this->conversationService->getOrCreateConversation($currentUser, $otherUser);
        if (!$conversation) {
            return response()->json([
                'message' => 'Cannot create conversation',
            ], 403);
        }
        $conversation->load(['userOne', 'userTwo']);

        // Load messages
        $messages = $this->messageService->getMessages($conversation, 50);

        // Mark messages as read when viewing conversation
        $this->messageService->markAsRead($conversation, $currentUser);

        return response()->json([
            'conversation' => new ConversationResource($conversation),
            'messages' => \App\Http\Resources\MessageResource::collection($messages->items()),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }
}
