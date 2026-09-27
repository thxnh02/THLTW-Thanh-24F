<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_post_category_post_and_page(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $categoryId = $this->postJson('/api/v1/admin/post-categories', [
            'name' => 'Huong dan',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'huong-dan')
            ->json('data.id');

        $postId = $this->postJson('/api/v1/admin/posts', [
            'post_category_id' => $categoryId,
            'title' => 'Cach mua hang',
            'excerpt' => 'Huong dan nhanh',
            'content' => 'Noi dung huong dan mua hang.',
            'status' => 'published',
            'published_at' => now()->toISOString(),
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'cach-mua-hang')
            ->json('data.id');

        $this->deleteJson('/api/v1/admin/post-categories/'.$categoryId)->assertStatus(409);

        $this->patchJson('/api/v1/admin/posts/'.$postId, [
            'post_category_id' => $categoryId,
            'title' => 'Cach mua hang online',
            'slug' => 'cach-mua-hang-online',
            'excerpt' => 'Huong dan nhanh',
            'content' => 'Noi dung da cap nhat.',
            'status' => 'draft',
        ])->assertOk()->assertJsonPath('data.status', 'draft');

        $pageId = $this->postJson('/api/v1/admin/pages', [
            'title' => 'Chinh sach bao mat',
            'content' => 'Noi dung chinh sach bao mat.',
            'status' => 'published',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'chinh-sach-bao-mat')
            ->json('data.id');

        $this->deleteJson('/api/v1/admin/pages/'.$pageId)->assertOk();
    }

    public function test_admin_can_manage_banner_menu_contact_and_settings(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $bannerId = $this->postJson('/api/v1/admin/banners', [
            'title' => 'Sale thang nay',
            'image' => '/hero-ecommerce.svg',
            'link' => '/products',
            'sort_order' => 1,
            'active' => true,
        ])->assertCreated()
            ->json('data.id');

        $this->patchJson('/api/v1/admin/banners/'.$bannerId, [
            'title' => 'Sale moi',
            'image' => '/hero-ecommerce.svg',
            'link' => '/products',
            'sort_order' => 2,
            'active' => false,
        ])->assertOk()->assertJsonPath('data.active', false);

        $menuId = $this->postJson('/api/v1/admin/menus', [
            'label' => 'San pham',
            'url' => '/products',
            'type' => 'custom',
            'sort_order' => 1,
            'active' => true,
        ])->assertCreated()
            ->json('data.id');

        $this->patchJson('/api/v1/admin/menus/'.$menuId, [
            'label' => 'Tat ca san pham',
            'url' => '/products',
            'type' => 'custom',
            'sort_order' => 1,
            'active' => true,
        ])->assertOk()->assertJsonPath('data.label', 'Tat ca san pham');

        $contact = Contact::create([
            'name' => 'Khach lien he',
            'email' => 'contact@example.com',
            'subject' => 'Can tu van',
            'message' => 'Noi dung lien he.',
        ]);

        $this->patchJson('/api/v1/admin/contacts/'.$contact->id, [
            'status' => 'resolved',
            'admin_note' => 'Da xu ly.',
        ])->assertOk()->assertJsonPath('data.status', 'resolved');

        $this->putJson('/api/v1/admin/settings', [
            'settings' => [
                ['key' => 'website_name', 'value' => 'THLTW Shop Pro', 'type' => 'string'],
                ['key' => 'shipping_fee', 'value' => '35000', 'type' => 'number'],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('settings', ['key' => 'website_name', 'value' => 'THLTW Shop Pro']);
    }
}
