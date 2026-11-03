<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureCustomerAccountActive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerAccountApiTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Accept' => 'application/json']);
    }

    public function test_profile_routes_require_active_verified_session(): void
    {
        $this->getJson('/api/account/profile')->assertUnauthorized();
        $this->getJson('/api/account/addresses')->assertUnauthorized();
        $this->postJson('/api/account/security/password', [])->assertUnauthorized();

        $unverified = $this->customer('unverified@example.com', false);
        $this->signIn($unverified);
        $this->patchJson('/api/account/profile', ['name' => 'New'])->assertOk();

        $blocked = $this->customer('blocked@example.com');
        $blocked->forceFill(['blocked_at' => now()])->save();
        $this->signIn($blocked);
        $this->getJson('/api/account/profile')->assertUnauthorized();
        $this->postJson('/api/account/addresses', $this->address())->assertUnauthorized();

        $valid = $this->customer('valid@example.com');
        $this->signIn($valid);
        $this->getJson('/api/account/profile')->assertOk();
        $valid->forceFill(['customer_auth_version' => 2])->save();
        $this->patchJson('/api/account/profile', ['name' => 'Invalidated'])->assertUnauthorized();
    }

    public function test_account_middleware_rejects_authenticated_requests_without_a_session(): void
    {
        $user = $this->customer('no-session@example.com');
        $request = Request::create('/api/account/profile');
        $request->setUserResolver(fn () => $user);

        $response = (new EnsureCustomerAccountActive)->handle($request, fn () => response()->json(['ok' => true]));
        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_profile_updates_only_allowed_fields_and_refreshes_customer_resource(): void
    {
        $user = $this->customer('profile@example.com');
        $this->signIn($user);
        $this->patchJson('/api/account/profile', [
            'name' => '  Nguyễn Thanh  ', 'phone' => '0912345678',
            'email' => 'changed@example.com', 'blocked_at' => now()->toDateTimeString(),
            'email_verified_at' => null, 'customer_auth_version' => 999,
            'password' => 'malicious-password',
        ])->assertOk()->assertJsonPath('data.user.name', 'Nguyễn Thanh')->assertJsonPath('data.user.phone', '0912345678');

        $this->assertSame('profile@example.com', $user->fresh()->email);
        $this->assertNull($user->fresh()->blocked_at);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame(1, $user->fresh()->customer_auth_version);
        $this->assertTrue(Hash::check('current-password', $user->fresh()->password));
        $this->patchJson('/api/account/profile', ['name' => '   ', 'phone' => 'abc'])->assertUnprocessable();
    }

    public function test_profile_patch_can_change_name_without_erasing_existing_phone(): void
    {
        $user = $this->customer('partial@example.com');
        $user->forceFill(['phone' => '0912345678'])->save();
        $this->signIn($user);

        $this->patchJson('/api/account/profile', ['name' => 'Tên mới'])
            ->assertOk()->assertJsonPath('data.user.phone', '0912345678');
        $this->assertSame('0912345678', $user->fresh()->phone);
    }

    public function test_avatar_upload_replacement_and_removal_are_owned_and_validated(): void
    {
        Storage::fake('public');
        $user = $this->customer('avatar@example.com');
        $other = $this->customer('other@example.com');
        $this->signIn($user);

        $this->postJson('/api/account/avatar', ['avatar' => UploadedFile::fake()->createWithContent('notes.txt', 'hello')])
            ->assertUnprocessable();
        $this->postJson('/api/account/avatar', ['avatar' => UploadedFile::fake()->createWithContent('spoof.png', 'not an image')])
            ->assertUnprocessable();
        $this->postJson('/api/account/avatar', ['avatar' => UploadedFile::fake()->createWithContent('oversize.png', base64_decode(self::PNG).str_repeat('x', 2 * 1024 * 1024))])
            ->assertUnprocessable();
        $widePng = substr_replace(base64_decode(self::PNG), pack('N', 5000), 16, 4);
        $this->postJson('/api/account/avatar', ['avatar' => UploadedFile::fake()->createWithContent('wide.png', $widePng)])
            ->assertUnprocessable();
        $this->postJson('/api/account/avatar', ['avatar' => $this->png()])->assertOk()->assertJsonStructure(['data' => ['user' => ['avatar_url']]]);
        $firstPath = $user->fresh()->avatar_path;
        $this->assertStringStartsWith('avatars/'.$user->id.'/', $firstPath);
        Storage::disk('public')->assertExists($firstPath);

        $otherPath = 'avatars/'.$other->id.'/keep.png';
        Storage::disk('public')->put($otherPath, base64_decode(self::PNG));
        $other->forceFill(['avatar_path' => $otherPath])->save();
        $this->postJson('/api/account/avatar', ['avatar' => $this->png()])->assertOk();
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($otherPath);
        $secondPath = $user->fresh()->avatar_path;
        $this->deleteJson('/api/account/avatar')->assertOk()->assertJsonPath('data.user.avatar_url', null);
        Storage::disk('public')->assertMissing($secondPath);
        Storage::disk('public')->assertExists($otherPath);
    }

    public function test_address_book_keeps_one_default_and_rejects_other_users_ids(): void
    {
        $user = $this->customer('address@example.com');
        $this->signIn($user);
        $first = $this->postJson('/api/account/addresses', $this->address())->assertCreated()
            ->assertJsonPath('data.address.is_default', true)->json('data.address.id');
        $second = $this->postJson('/api/account/addresses', $this->address(['recipient_name' => 'Người nhận 2', 'label' => 'Công ty', 'user_id' => 999, 'is_default' => true]))
            ->assertCreated()->assertJsonPath('data.address.is_default', false)->json('data.address.id');
        $this->assertDatabaseHas('user_addresses', ['id' => $second, 'user_id' => $user->id, 'is_default' => false]);
        $this->patchJson("/api/account/addresses/{$second}/default")->assertOk();
        $this->getJson('/api/account/addresses')->assertOk()->assertJsonCount(2, 'data.addresses')
            ->assertJsonPath('data.addresses.0.id', $second)->assertJsonPath('data.addresses.0.is_default', true);
        $this->deleteJson("/api/account/addresses/{$second}")->assertOk();
        $this->getJson('/api/account/addresses')->assertJsonPath('data.addresses.0.id', $first)
            ->assertJsonPath('data.addresses.0.is_default', true);
        $this->patchJson("/api/account/addresses/{$first}", $this->address(['street' => '12 Nguyễn Huệ']))
            ->assertOk()->assertJsonPath('data.address.street', '12 Nguyễn Huệ');

    }

    public function test_address_ids_belonging_to_another_user_are_hidden(): void
    {
        $owner = $this->customer('owner@example.com');
        $other = $this->customer('another@example.com');
        $first = $owner->addresses()->create($this->address());
        $this->signIn($other);
        $first = $first->id;
        $this->getJson("/api/account/addresses/{$first}")->assertNotFound();
        $this->patchJson("/api/account/addresses/{$first}", $this->address())->assertNotFound();
        $this->patchJson("/api/account/addresses/{$first}/default")->assertNotFound();
        $this->deleteJson("/api/account/addresses/{$first}")->assertNotFound();
        $this->getJson('/api/account/addresses')->assertJsonCount(0, 'data.addresses');
    }

    public function test_address_can_become_default_during_creation_or_edit_without_losing_legacy_fields(): void
    {
        $user = $this->customer('default-choice@example.com');
        $this->signIn($user);
        $first = $this->postJson('/api/account/addresses', $this->address([
            'district' => 'Quận cũ', 'province_code' => null, 'ward_code' => null,
        ]))->assertCreated()->json('data.address.id');
        $second = $this->postJson('/api/account/addresses', $this->address([
            'label' => 'Công ty', 'make_default' => true,
        ]))->assertCreated()->assertJsonPath('data.address.is_default', true)->json('data.address.id');
        $this->assertDatabaseHas('user_addresses', ['id' => $first, 'district' => 'Quận cũ', 'is_default' => false]);
        $this->patchJson("/api/account/addresses/{$first}", $this->address([
            'district' => 'Quận cũ', 'make_default' => true,
        ]))->assertOk()->assertJsonPath('data.address.is_default', true);
        $this->assertDatabaseHas('user_addresses', ['id' => $second, 'is_default' => false]);
        $this->assertSame(1, $user->addresses()->where('is_default', true)->count());
    }

    public function test_address_limit_and_validation_preserve_existing_entries(): void
    {
        $user = $this->customer('limit@example.com');
        $this->signIn($user);
        $this->postJson('/api/account/addresses', $this->address(['ward' => '', 'recipient_phone' => 'bad']))->assertUnprocessable();
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/account/addresses', $this->address(['street' => "Số {$i}"]))->assertCreated();
        }
        $this->postJson('/api/account/addresses', $this->address())->assertUnprocessable();
        $this->getJson('/api/account/addresses')->assertJsonCount(10, 'data.addresses');
    }

    public function test_password_change_checks_current_password_and_invalidates_old_sessions(): void
    {
        $user = $this->customer('security@example.com');
        $this->signIn($user);
        $this->postJson('/api/account/security/password', [
            'current_password' => 'wrong', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123',
        ])->assertUnprocessable();
        $this->postJson('/api/account/security/password', [
            'current_password' => 'current-password', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123',
        ])->assertOk();
        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
        $this->assertSame(2, $user->fresh()->customer_auth_version);
        $this->getJson('/api/account/profile')->assertUnauthorized();
    }

    private function signIn(User $user): void
    {
        $this->app['auth']->forgetGuards();
        $this->withSession(['customer_auth_version' => (int) $user->customer_auth_version])->actingAs($user);
    }

    private function customer(string $email, bool $verified = true): User
    {
        $user = User::query()->create(['name' => 'Khách hàng', 'email' => $email, 'password' => Hash::make('current-password')]);
        if ($verified) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $user->fresh();
    }

    private function address(array $overrides = []): array
    {
        return array_replace([
            'label' => 'Nhà riêng', 'recipient_name' => 'Nguyễn An', 'recipient_phone' => '0912345678',
            'province' => 'Thành phố Hồ Chí Minh', 'ward' => 'Phường Bến Thành', 'street' => '1 Lê Lợi',
            'detail' => 'Tầng 2', 'delivery_note' => '',
        ], $overrides);
    }

    private function png(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('avatar.png', base64_decode(self::PNG));
    }
}
