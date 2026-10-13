<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_image_to_public_disk(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());

        $path = $this->postJson('/api/v1/admin/uploads/images', [
            'directory' => 'products',
            'image' => UploadedFile::fake()->createWithContent(
                'phone.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
            ),
        ])->assertCreated()
            ->assertJsonPath('data.disk', 'public')
            ->json('data.path');

        Storage::disk('public')->assertExists($path);
    }

    public function test_admin_can_list_and_delete_uploaded_image(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());
        Storage::disk('public')->put('uploads/images/products/demo.png', 'image-content');

        $this->getJson('/api/v1/admin/uploads/images?directory=products')
            ->assertOk()
            ->assertJsonPath('data.0.path', 'uploads/images/products/demo.png');

        $this->deleteJson('/api/v1/admin/uploads/images', [
            'path' => 'uploads/images/products/demo.png',
        ])->assertOk();

        Storage::disk('public')->assertMissing('uploads/images/products/demo.png');
    }

    public function test_admin_upload_rejects_non_image_file(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/uploads/images', [
            'image' => UploadedFile::fake()->create('document.pdf', 20, 'application/pdf'),
        ])->assertUnprocessable();
    }
}
