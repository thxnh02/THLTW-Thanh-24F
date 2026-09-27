<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\Post;
use App\Models\PostCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_posts_can_be_filtered_by_category_and_page_can_be_loaded(): void
    {
        $category = PostCategory::create(['name' => 'Tin khuyen mai', 'slug' => 'tin-khuyen-mai', 'status' => 'active']);
        Post::create([
            'post_category_id' => $category->id,
            'title' => 'Bai viet cong khai',
            'slug' => 'bai-viet-cong-khai',
            'content' => 'Noi dung cong khai.',
            'status' => 'published',
            'published_at' => now(),
        ]);
        Post::create([
            'title' => 'Bai viet nhap',
            'slug' => 'bai-viet-nhap',
            'content' => 'Noi dung nhap.',
            'status' => 'draft',
        ]);
        Page::create([
            'title' => 'Gioi thieu',
            'slug' => 'gioi-thieu',
            'content' => 'Noi dung gioi thieu.',
            'status' => 'published',
        ]);

        $this->getJson('/api/v1/post-categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'tin-khuyen-mai');

        $this->getJson('/api/v1/posts?category=tin-khuyen-mai')
            ->assertOk()
            ->assertJsonPath('data.data.0.slug', 'bai-viet-cong-khai')
            ->assertJsonMissing(['slug' => 'bai-viet-nhap']);

        $this->getJson('/api/v1/pages/gioi-thieu')
            ->assertOk()
            ->assertJsonPath('data.slug', 'gioi-thieu');
    }
}
