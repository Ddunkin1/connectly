<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user  = User::factory()->create();
        $this->token = $this->user->createToken('test')->plainTextToken;
    }

    public function test_authenticated_user_can_create_post(): void
    {
        $this->withToken($this->token)
            ->postJson('/api/posts', [
                'content'    => 'Hello world #test',
                'visibility' => 'public',
            ])->assertStatus(201)
              ->assertJsonPath('post.content', 'Hello world #test');

        $this->assertDatabaseHas('posts', [
            'user_id' => $this->user->id,
            'content' => 'Hello world #test',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_post(): void
    {
        $this->postJson('/api/posts', [
            'content'    => 'Hello world',
            'visibility' => 'public',
        ])->assertStatus(401);
    }

    public function test_user_can_edit_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id, 'content' => 'Original']);

        $this->withToken($this->token)
            ->putJson("/api/posts/{$post->id}", [
                'content'    => 'Updated content',
                'visibility' => 'public',
            ])->assertOk()
              ->assertJsonPath('post.content', 'Updated content');
    }

    public function test_user_cannot_edit_another_users_post(): void
    {
        $other = User::factory()->create();
        $post  = Post::factory()->create(['user_id' => $other->id]);

        $this->withToken($this->token)
            ->putJson("/api/posts/{$post->id}", ['content' => 'Hijacked'])
            ->assertStatus(403);
    }

    public function test_user_can_delete_own_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);

        $this->withToken($this->token)
            ->deleteJson("/api/posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_user_cannot_delete_another_users_post(): void
    {
        $other = User::factory()->create();
        $post  = Post::factory()->create(['user_id' => $other->id]);

        $this->withToken($this->token)
            ->deleteJson("/api/posts/{$post->id}")
            ->assertStatus(403);
    }

    public function test_user_can_like_a_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id, 'visibility' => 'public']);

        $this->withToken($this->token)
            ->postJson("/api/posts/{$post->id}/like")
            ->assertOk();

        $this->assertDatabaseHas('likes', [
            'user_id'       => $this->user->id,
            'likeable_id'   => $post->id,
            'likeable_type' => Post::class,
        ]);
    }

    public function test_user_can_unlike_a_post(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id, 'visibility' => 'public']);

        $this->withToken($this->token)->postJson("/api/posts/{$post->id}/like");
        $this->withToken($this->token)
            ->deleteJson("/api/posts/{$post->id}/unlike")
            ->assertOk();

        $this->assertDatabaseMissing('likes', [
            'user_id'     => $this->user->id,
            'likeable_id' => $post->id,
        ]);
    }

    public function test_private_posts_are_not_visible_to_others(): void
    {
        $other = User::factory()->create();
        Post::factory()->create([
            'user_id'    => $other->id,
            'visibility' => 'private',
            'content'    => 'Secret post',
        ]);

        $this->withToken($this->token)
            ->getJson('/api/posts')
            ->assertOk()
            ->assertJsonMissing(['content' => 'Secret post']);
    }
}
