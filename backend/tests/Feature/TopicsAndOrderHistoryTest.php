<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureAdminBrowserSession;
use App\Models\Category;
use App\Models\Order;
use App\Models\Post;
use App\Models\PostTopic;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TopicsAndOrderHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_topics_filter_published_posts_and_cannot_be_deleted_while_referenced(): void
    {
        $this->postJson('/api/admin/post-topics', ['name' => 'Guides', 'slug' => 'guides'])->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $id = $this->postJson('/api/admin/post-topics', ['name' => 'Guides', 'slug' => 'guides'])->assertCreated()->json('data.id');
        $topic = PostTopic::findOrFail($id);
        $post = Post::create(['title' => 'Guide', 'slug' => 'guide', 'content' => 'Content', 'status' => true, 'topic_id' => $id]);
        Post::create(['title' => 'Hidden', 'slug' => 'hidden', 'content' => 'Content', 'status' => false, 'topic_id' => $id]);
        $this->getJson('/api/posts?topic=guides')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'guide');
        $this->getJson('/api/posts?topic=other')->assertOk()->assertJsonCount(0, 'data');
        $this->deleteJson('/api/admin/post-topics/'.$id)->assertUnprocessable();
        $post->delete();
        $this->deleteJson('/api/admin/post-topics/'.$id)->assertUnprocessable();
        $this->assertTrue($topic->exists());
    }

    public function test_admin_can_cancel_cod_only_once_restores_stock_and_records_history(): void
    {
        $user = User::create(['name' => 'Customer', 'email' => 'history@example.test', 'password' => Hash::make('password')]);
        $category = Category::create(['name' => 'Category', 'slug' => 'category', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Product', 'slug' => 'product', 'price' => 10000, 'status' => true, 'stock_quantity' => 3]);
        $order = new Order;
        $order->forceFill(['user_id' => $user->id, 'status' => 'pending', 'payment_method' => 'cod', 'payment_status' => 'pending'])->save();
        $order->items()->create(['product_id' => $product->id, 'product_name' => 'Product', 'product_slug' => 'product', 'unit_price_vnd' => 10000, 'quantity' => 2, 'line_total_vnd' => 20000]);
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->patchJson('/api/admin/orders/'.$order->id.'/status', ['status' => 'cancelled'])->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(5, $product->fresh()->stock_quantity);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'before_quantity' => 3, 'after_quantity' => 5, 'reason' => 'Quản trị hủy đơn']);
        $this->patchJson('/api/admin/orders/'.$order->id.'/status', ['status' => 'cancelled'])->assertUnprocessable();
        $this->assertSame(5, $product->fresh()->stock_quantity);
        $this->getJson('/api/admin/orders/'.$order->id)->assertOk()->assertJsonPath('data.status_history.0.to_status', 'pending')
            ->assertJsonPath('data.status_history.1.from_status', 'pending')->assertJsonPath('data.status_history.1.to_status', 'cancelled');
        $vnpay = new Order;
        $vnpay->forceFill(['user_id' => $user->id, 'status' => 'pending', 'payment_method' => 'vnpay', 'payment_status' => 'paid'])->save();
        $this->patchJson('/api/admin/orders/'.$vnpay->id.'/status', ['status' => 'cancelled'])->assertUnprocessable();
        $this->patchJson('/api/admin/orders/'.$vnpay->id.'/status', ['status' => 'processing'])->assertOk();
        $this->patchJson('/api/admin/orders/'.$vnpay->id.'/status', ['status' => 'shipping'])->assertOk()->assertJsonPath('data.status', 'shipping');
        $this->patchJson('/api/admin/orders/'.$vnpay->id.'/status', ['status' => 'delivered'])->assertOk();
        $this->getJson('/api/admin/orders/'.$vnpay->id)->assertOk()->assertJsonPath('data.status_history.2.to_status', 'shipping');
    }

    public function test_inventory_adjustment_records_changes_and_rejects_negative_stock(): void
    {
        $category = Category::create(['name' => 'Category', 'slug' => 'category', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Product', 'slug' => 'product', 'price' => 10000, 'status' => true, 'stock_quantity' => 5]);
        $this->postJson('/api/admin/inventory/products/'.$product->id.'/adjust', ['change' => 3, 'reason' => 'Nhập hàng'])->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->postJson('/api/admin/inventory/products/'.$product->id.'/adjust', ['change' => 3, 'reason' => 'Nhập hàng'])->assertOk()->assertJsonPath('data.stock_quantity', 8);
        $this->assertDatabaseHas('stock_movements', ['product_id' => $product->id, 'before_quantity' => 5, 'after_quantity' => 8, 'reason' => 'Nhập hàng']);
        $this->postJson('/api/admin/inventory/products/'.$product->id.'/adjust', ['change' => -9, 'reason' => 'Xuất hàng'])->assertUnprocessable();
        $this->assertSame(8, $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('stock_movements', 2);
        $this->putJson('/api/admin/products/'.$product->id, [
            'category_id' => $category->id, 'name' => 'Product', 'slug' => 'product', 'price' => 10000,
            'status' => true, 'stock_quantity' => 5, 'expected_stock_quantity' => 5,
        ])->assertUnprocessable()->assertJsonValidationErrors('stock_quantity');
        $this->assertSame(8, $product->fresh()->stock_quantity);
    }

    public function test_contact_is_received_and_only_admin_can_manage_or_reply(): void
    {
        Mail::fake();
        $this->postJson('/api/contacts', ['name' => 'Customer', 'email' => 'wrong', 'subject' => 'Question', 'message' => 'Hello'])->assertUnprocessable();
        $this->postJson('/api/contacts', ['name' => 'Customer', 'email' => 'customer@example.test', 'subject' => 'Question', 'message' => 'Hello'])->assertCreated();
        $id = \App\Models\ContactMessage::firstOrFail()->id;
        $this->getJson('/api/admin/contacts')->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->getJson('/api/admin/contacts?status=new')->assertOk()->assertJsonCount(1, 'data');
        $this->patchJson('/api/admin/contacts/'.$id, ['status' => 'processed'])->assertOk()->assertJsonPath('data.status', 'processed');
        $this->postJson('/api/admin/contacts/'.$id.'/reply', ['reply' => 'Thank you'])->assertOk()->assertJsonPath('data.status', 'replied');
        $this->assertDatabaseHas('contact_messages', ['id' => $id, 'reply' => 'Thank you']);
        $this->deleteJson('/api/admin/contacts/'.$id)->assertNoContent();
    }

    public function test_site_content_is_public_only_when_active_and_rejects_unsafe_links(): void
    {
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $page = ['type' => 'page', 'title' => 'Returns', 'slug' => 'returns', 'body' => 'Details', 'active' => false, 'sort_order' => 0];
        $id = $this->postJson('/api/admin/site-content', $page)->assertCreated()->json('data.id');
        $this->getJson('/api/pages/returns')->assertNotFound();
        $this->putJson('/api/admin/site-content/'.$id, [...$page, 'active' => true])->assertOk();
        $this->getJson('/api/pages/returns')->assertOk()->assertJsonPath('data.body', 'Details');
        $menu = ['type' => 'menu', 'title' => 'Returns', 'slug' => 'returns', 'href' => '/pages/returns', 'active' => true, 'sort_order' => 0];
        $this->postJson('/api/admin/site-content', [...$menu, 'href' => '//bad.example'])->assertUnprocessable();
        $this->postJson('/api/admin/site-content', [...$menu, 'href' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->postJson('/api/admin/site-content', $menu)->assertCreated();
        $this->getJson('/api/site-content/menu')->assertOk()->assertJsonPath('data.0.href', '/pages/returns');
    }

    public function test_store_information_seeder_preserves_existing_content(): void
    {
        $existing = \App\Models\SiteContent::create(['type' => 'page', 'slug' => 'gioi-thieu', 'title' => 'Nội dung của cửa hàng', 'body' => 'Đã chỉnh sửa', 'active' => true, 'sort_order' => 1]);
        $this->seed(\Database\Seeders\StoreInformationSeeder::class);
        $this->seed(\Database\Seeders\StoreInformationSeeder::class);
        $this->assertSame('Đã chỉnh sửa', $existing->fresh()->body);
        $this->assertDatabaseCount('site_content', 3);
        $this->getJson('/api/site-content/page')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_site_settings_can_only_be_saved_by_admin(): void
    {
        $this->getJson('/api/site-settings')->assertOk()->assertJsonPath('data.shop_name', 'CT_24F');
        $this->putJson('/api/admin/site-settings', ['shop_name' => 'Shop'])->assertUnauthorized();
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->putJson('/api/admin/site-settings', ['shop_name' => 'Shop', 'logo_url' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->putJson('/api/admin/site-settings', ['shop_name' => 'Shop', 'contact_email' => 'shop@example.test', 'logo_url' => '/logo.png'])->assertOk();
        $this->getJson('/api/site-settings')->assertOk()->assertJsonPath('data.logo_url', '/logo.png')->assertJsonPath('data.shop_name', 'Shop');
    }

    public function test_user_delete_keeps_existing_order_history(): void
    {
        $first = User::create(['name' => 'Buyer', 'email' => 'buyer@example.test', 'password' => Hash::make('password')]);
        $second = User::create(['name' => 'New customer', 'email' => 'new@example.test', 'password' => Hash::make('password')]);
        $order = Order::create(['user_id' => $first->id, 'status' => 'pending']);
        $this->withoutMiddleware(EnsureAdminBrowserSession::class);
        $this->getJson('/api/admin/users/'.$first->id)->assertOk()->assertJsonPath('data.orders.0.id', $order->id);
        $this->deleteJson('/api/admin/users/'.$first->id)->assertUnprocessable();
        $this->deleteJson('/api/admin/users/'.$second->id)->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $second->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'user_id' => $first->id]);
    }
}
