<?php

namespace Tests\Feature;

use App\Models\FriendRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class FriendRequestTest extends TestCase
{
    use RefreshDatabase;

    private User $sender;
    private User $receiver;
    private string $senderToken;
    private string $receiverToken;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->sender        = User::factory()->create();
        $this->receiver      = User::factory()->create();
        $this->senderToken   = $this->sender->createToken('test')->plainTextToken;
        $this->receiverToken = $this->receiver->createToken('test')->plainTextToken;
    }

    public function test_user_can_send_friend_request(): void
    {
        $this->withToken($this->senderToken)
            ->postJson("/api/users/{$this->receiver->id}/friend-request")
            ->assertStatus(201)
            ->assertJsonPath('message', 'Friend request sent successfully');

        $this->assertDatabaseHas('friend_requests', [
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);
    }

    public function test_user_cannot_send_request_to_self(): void
    {
        $this->withToken($this->senderToken)
            ->postJson("/api/users/{$this->sender->id}/friend-request")
            ->assertStatus(422);
    }

    public function test_duplicate_friend_request_returns_422(): void
    {
        FriendRequest::create([
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);

        $this->withToken($this->senderToken)
            ->postJson("/api/users/{$this->receiver->id}/friend-request")
            ->assertStatus(422);
    }

    public function test_receiver_can_accept_friend_request(): void
    {
        $fr = FriendRequest::create([
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);

        $this->withToken($this->receiverToken)
            ->postJson("/api/friend-requests/{$fr->id}/accept")
            ->assertOk()
            ->assertJsonPath('message', 'Friend request accepted');

        $this->assertDatabaseHas('friend_requests', [
            'id'     => $fr->id,
            'status' => 'accepted',
        ]);
    }

    public function test_receiver_can_reject_friend_request(): void
    {
        $fr = FriendRequest::create([
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);

        $this->withToken($this->receiverToken)
            ->postJson("/api/friend-requests/{$fr->id}/reject")
            ->assertOk()
            ->assertJsonPath('message', 'Friend request rejected');

        $this->assertDatabaseHas('friend_requests', [
            'id'     => $fr->id,
            'status' => 'rejected',
        ]);
    }

    public function test_sender_cannot_accept_own_request(): void
    {
        $fr = FriendRequest::create([
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);

        $this->withToken($this->senderToken)
            ->postJson("/api/friend-requests/{$fr->id}/accept")
            ->assertStatus(403);
    }

    public function test_sender_can_cancel_own_request(): void
    {
        $fr = FriendRequest::create([
            'sender_id'   => $this->sender->id,
            'receiver_id' => $this->receiver->id,
            'status'      => 'pending',
        ]);

        $this->withToken($this->senderToken)
            ->deleteJson("/api/friend-requests/{$fr->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Friend request cancelled');

        $this->assertDatabaseMissing('friend_requests', ['id' => $fr->id]);
    }

    public function test_unauthenticated_user_cannot_send_friend_request(): void
    {
        $this->postJson("/api/users/{$this->receiver->id}/friend-request")
            ->assertStatus(401);
    }
}
