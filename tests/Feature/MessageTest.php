<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    private User $alice;
    private User $bob;
    private string $aliceToken;

    protected function setUp(): void
    {
        parent::setUp();
        $this->alice      = User::factory()->create();
        $this->bob        = User::factory()->create();
        $this->aliceToken = $this->alice->createToken('test')->plainTextToken;
    }

    public function test_user_can_send_a_message(): void
    {
        $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'receiver_id' => $this->bob->id,
                'message'     => 'Hello Bob!',
            ])->assertStatus(201)
              ->assertJsonPath('message.message', 'Hello Bob!');
    }

    public function test_sent_message_appears_in_conversation(): void
    {
        // Send a message to create the conversation
        $response = $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'receiver_id' => $this->bob->id,
                'message'     => 'Hey there',
            ]);

        $response->assertStatus(201);
        $conversationId = $response->json('conversation.id');

        // The message should now be retrievable
        $this->withToken($this->aliceToken)
            ->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonFragment(['message' => 'Hey there']);
    }

    public function test_user_cannot_message_themselves(): void
    {
        $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'receiver_id' => $this->alice->id,
                'message'     => 'Note to self',
            ])->assertStatus(422);
    }

    public function test_message_requires_receiver_id(): void
    {
        $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'message' => 'No receiver',
            ])->assertStatus(422)
              ->assertJsonValidationErrors(['receiver_id']);
    }

    public function test_message_requires_content_when_no_media(): void
    {
        $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'receiver_id' => $this->bob->id,
            ])->assertStatus(422)
              ->assertJsonValidationErrors(['message']);
    }

    public function test_unauthenticated_user_cannot_send_message(): void
    {
        $this->postJson('/api/messages', [
            'receiver_id' => $this->bob->id,
            'message'     => 'Unauthorized',
        ])->assertStatus(401);
    }

    public function test_conversation_list_returns_after_message(): void
    {
        $this->withToken($this->aliceToken)
            ->postJson('/api/messages', [
                'receiver_id' => $this->bob->id,
                'message'     => 'First message',
            ])->assertStatus(201);

        $this->withToken($this->aliceToken)
            ->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonStructure(['data' => ['conversations']]);
    }
}
