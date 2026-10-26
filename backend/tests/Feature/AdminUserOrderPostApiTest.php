<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserOrderPostApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_are_paginated_and_detail_never_exposes_secrets(): void
    {
        foreach (range(1, 11) as $number) {
            User::create(['name' => "User {$number}", 'email' => "user{$number}@example.test", 'password' => 'secret']);
        }
        $user = User::findOrFail(1);
        Order::create(['user_id' => $user->id]);

        $this->getJson('/api/admin/users')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11)
            ->assertJsonMissingPath('data.0.password')->assertJsonMissingPath('data.0.remember_token');
        $this->getJson('/api/admin/users?page=2')->assertOk()->assertJsonCount(1, 'data');
        $detail = $this->getJson("/api/admin/users/{$user->id}")->assertOk()->assertJsonPath('data.orders_count', 1);
        $detail->assertJsonMissingPath('data.password')->assertJsonMissingPath('data.remember_token');
        $this->getJson('/api/admin/users/99999')->assertNotFound();
    }

    public function test_blocking_is_reversible_and_does_not_delete_user_or_orders(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'customer@example.test']);
        $order = Order::create(['user_id' => $user->id]);

        $this->patchJson("/api/admin/users/{$user->id}/block")->assertOk()->assertJsonPath('data.blocked_at', fn ($value) => $value !== null);
        $this->assertNotNull($user->fresh()->blocked_at);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'user_id' => $user->id]);
        $this->patchJson("/api/admin/users/{$user->id}/unblock")->assertOk()->assertJsonPath('data.blocked_at', null);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'blocked_at' => null]);
        $this->patchJson('/api/admin/users/99999/block')->assertNotFound();
    }

    public function test_orders_paginate_load_customer_and_reject_invalid_status_transitions(): void
    {
        $user = User::create(['name' => 'Buyer', 'email' => 'buyer@example.test']);
        foreach (range(1, 11) as $number) {
            Order::create(['user_id' => $user->id, 'status' => $number === 11 ? 'processing' : 'pending']);
        }
        $order = Order::findOrFail(1);

        $this->getJson('/api/admin/orders')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11);
        $this->getJson('/api/admin/orders?status=processing')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/admin/orders/{$order->id}")->assertOk()
            ->assertJsonPath('data.user.name', 'Buyer')
            ->assertJsonPath('data.allowed_next_statuses.0', 'processing');
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'paid'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertOk()->assertJsonPath('data.status', 'processing');
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertOk()->assertJsonPath('data.status', 'delivered');
        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'pending'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'user_id' => $user->id, 'status' => 'delivered']);
        $this->getJson('/api/admin/orders/99999')->assertNotFound();
        $this->patchJson('/api/admin/orders/99999/status', ['status' => 'processing'])->assertNotFound();
    }

    public function test_posts_support_paginated_list_detail_create_edit_and_soft_delete(): void
    {
        foreach (range(1, 11) as $number) {
            Post::create(['title' => "Post {$number}", 'slug' => "post-{$number}", 'content' => 'Content', 'status' => true]);
        }
        $this->getJson('/api/admin/posts')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11);
        $this->getJson('/api/admin/posts?page=2')->assertOk()->assertJsonCount(1, 'data');

        $payload = ['title' => 'New Post', 'slug' => 'new-post', 'content' => 'Actual content', 'status' => false];
        $this->postJson('/api/admin/posts', $payload)->assertCreated()->assertJsonPath('data.slug', 'new-post');
        $this->postJson('/api/admin/posts', [...$payload, 'title' => 'Duplicate slug'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->postJson('/api/admin/posts', ['title' => '', 'slug' => '', 'content' => '', 'status' => false])
            ->assertUnprocessable()->assertJsonValidationErrors(['title', 'slug', 'content']);

        $post = Post::where('slug', 'new-post')->firstOrFail();
        $this->getJson("/api/admin/posts/{$post->id}")->assertOk()->assertJsonPath('data.content', 'Actual content');
        $this->putJson("/api/admin/posts/{$post->id}", [...$payload, 'slug' => 'post-1'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->putJson("/api/admin/posts/{$post->id}", [...$payload, 'title' => 'Updated', 'slug' => 'updated-post', 'status' => true])
            ->assertOk()->assertJsonPath('data.title', 'Updated')->assertJsonPath('data.status', true);
        $this->deleteJson("/api/admin/posts/{$post->id}")->assertOk();
        $this->assertSoftDeleted('posts', ['id' => $post->id]);
        $this->getJson("/api/admin/posts/{$post->id}")->assertNotFound();
        $this->getJson('/api/admin/posts/trash')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $post->id);
        $this->postJson('/api/admin/posts', [...$payload, 'slug' => 'updated-post'])
            ->assertUnprocessable()->assertJsonValidationErrors('slug');
        $this->postJson("/api/admin/posts/{$post->id}/restore")->assertOk()->assertJsonPath('data.deleted_at', null);
        $this->getJson("/api/admin/posts/{$post->id}")->assertOk();
        $this->deleteJson("/api/admin/posts/{$post->id}/force")->assertNotFound();
        $this->deleteJson("/api/admin/posts/{$post->id}")->assertOk();
        $this->deleteJson("/api/admin/posts/{$post->id}/force")->assertOk();
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
        $this->postJson("/api/admin/posts/{$post->id}/restore")->assertNotFound();
        $this->putJson('/api/admin/posts/99999', $payload)->assertNotFound();
        $this->deleteJson('/api/admin/posts/99999')->assertNotFound();
    }

    public function test_post_trash_is_paginated_and_excludes_active_posts(): void
    {
        foreach (range(1, 12) as $number) {
            $post = Post::create(['title' => "Post {$number}", 'slug' => "post-{$number}", 'content' => 'Content', 'status' => true]);
            if ($number <= 11) {
                $post->delete();
            }
        }

        $this->getJson('/api/admin/posts')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/admin/posts/trash')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11);
        $this->getJson('/api/admin/posts/trash?page=2')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_public_posts_only_show_published_active_content(): void
    {
        foreach (range(1, 11) as $number) {
            Post::create(['title' => "Published {$number}", 'slug' => "published-{$number}", 'content' => 'Public content', 'status' => true]);
        }
        $draft = Post::create(['title' => 'Draft', 'slug' => 'draft', 'content' => 'Private draft', 'status' => false]);
        $trashed = Post::create(['title' => 'Removed', 'slug' => 'removed', 'content' => 'Removed content', 'status' => true]);
        $trashed->delete();

        $this->getJson('/api/posts')->assertOk()->assertJsonCount(9, 'data')->assertJsonPath('meta.total', 11)
            ->assertJsonMissingPath('data.0.content')->assertJsonMissingPath('data.0.status');
        $this->getJson('/api/posts?page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/posts/published-1')->assertOk()->assertJsonPath('data.content', 'Public content');
        $this->getJson("/api/posts/{$draft->slug}")->assertNotFound();
        $this->getJson("/api/posts/{$trashed->slug}")->assertNotFound();
    }
}
