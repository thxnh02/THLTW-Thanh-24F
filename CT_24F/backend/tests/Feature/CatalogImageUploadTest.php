<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\CatalogImage;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CatalogImageUploadTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

    public function test_product_upload_is_saved_in_database_and_can_be_replaced_or_removed(): void
    {
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $payload = ['category_id' => $category->id, 'name' => 'Camera', 'slug' => 'camera', 'price' => 100, 'status' => 1];

        $created = $this->post('/api/admin/products', [...$payload, 'image_file' => $this->png()], ['Accept' => 'application/json'])->assertCreated();
        $id = $created->json('data.id');
        $url = $created->json('data.image');
        $this->assertMatchesRegularExpression('#^/api/catalog-images/\d+$#', $url);
        $image = CatalogImage::query()->where('owner_type', 'product')->where('owner_id', $id)->firstOrFail();
        $this->assertSame(base64_decode(self::PNG), base64_decode($image->content_base64));
        $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/png')->assertContent(base64_decode(self::PNG));

        $this->post("/api/admin/products/{$id}", [...$payload, '_method' => 'PUT', 'image_file' => $this->png()], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.image', $url);
        $this->assertDatabaseCount('catalog_images', 1);

        $this->putJson("/api/admin/products/{$id}", [...$payload, 'image' => ''])
            ->assertOk()->assertJsonPath('data.image', null);
        $this->assertDatabaseCount('catalog_images', 0);
        $this->get($url)->assertNotFound();
    }

    public function test_category_and_brand_uploads_survive_soft_delete_but_not_permanent_delete(): void
    {
        $category = $this->post('/api/admin/categories', ['name' => 'Accessories', 'slug' => 'accessories', 'status' => 1, 'image_file' => $this->png()], ['Accept' => 'application/json'])->assertCreated();
        $brand = $this->post('/api/admin/brands', ['name' => 'Acme', 'slug' => 'acme', 'status' => 1, 'logo_file' => $this->png()], ['Accept' => 'application/json'])->assertCreated();

        $categoryId = $category->json('data.id');
        $brandId = $brand->json('data.id');
        $categoryUrl = $category->json('data.image');
        $brandUrl = $brand->json('data.logo');
        $this->assertDatabaseCount('catalog_images', 2);
        $this->get($categoryUrl)->assertOk();
        $this->get($brandUrl)->assertOk();

        $this->post("/api/admin/categories/{$categoryId}", ['_method' => 'PUT', 'name' => 'Accessories', 'slug' => 'accessories', 'status' => 1, 'image_file' => $this->png()], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.image', $categoryUrl);
        $this->post("/api/admin/brands/{$brandId}", ['_method' => 'PUT', 'name' => 'Acme', 'slug' => 'acme', 'status' => 1, 'logo_file' => $this->png()], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.logo', $brandUrl);
        $this->assertDatabaseCount('catalog_images', 2);

        $this->deleteJson("/api/admin/categories/{$categoryId}")->assertOk();
        $this->deleteJson("/api/admin/brands/{$brandId}")->assertOk();
        $this->get($categoryUrl)->assertOk();
        $this->get($brandUrl)->assertOk();

        $this->deleteJson("/api/admin/categories/{$categoryId}/force")->assertOk();
        $this->deleteJson("/api/admin/brands/{$brandId}/force")->assertOk();
        $this->assertDatabaseCount('catalog_images', 0);
        $this->get($categoryUrl)->assertNotFound();
        $this->get($brandUrl)->assertNotFound();
    }

    public function test_non_image_upload_is_rejected_without_creating_a_product(): void
    {
        $category = Category::create(['name' => 'Devices', 'slug' => 'devices', 'status' => true]);
        $this->post('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'Invalid image',
            'slug' => 'invalid-image',
            'price' => 100,
            'status' => 1,
            'image_file' => UploadedFile::fake()->createWithContent('notes.txt', 'not an image'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image_file');

        $this->assertDatabaseCount('products', 0);
        $this->assertDatabaseCount('catalog_images', 0);
    }

    public function test_image_larger_than_two_megabytes_is_rejected(): void
    {
        $oversized = UploadedFile::fake()->createWithContent('large.png', base64_decode(self::PNG).str_repeat("\0", 2 * 1024 * 1024));
        $this->post('/api/admin/categories', [
            'name' => 'Too large',
            'slug' => 'too-large',
            'status' => 1,
            'image_file' => $oversized,
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('image_file');

        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('catalog_images', 0);
    }

    private function png(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('photo.png', base64_decode(self::PNG));
    }
}
