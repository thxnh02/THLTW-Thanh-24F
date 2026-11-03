<?php

namespace Tests\Feature;

use App\Mail\AdminNewOrderMail;
use App\Mail\GenericAccountNoticeMail;
use App\Mail\OrderEventMail;
use App\Models\Order;
use App\Models\User;
use App\Support\CommerceNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

class OrderExportAndEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Origin' => 'http://127.0.0.1:3000', 'Referer' => 'http://127.0.0.1:3000/', 'Accept' => 'application/json']);
    }

    public function test_customer_pdf_is_a_real_owner_scoped_pdf_and_admin_export_requires_admin(): void
    {
        $owner = $this->user('owner@example.test');
        $order = $this->order($owner);
        $order->items()->create([
            'product_name' => 'Tai nghe thử nghiệm', 'product_slug' => 'tai-nghe', 'unit_price_vnd' => 5000,
            'quantity' => 1, 'line_total_vnd' => 5000,
        ]);

        $this->postJson('/api/auth/login', ['email' => $owner->email, 'password' => 'synthetic-password'])->assertOk();
        $pdf = $this->getJson('/api/account/orders/'.$order->id.'/export/pdf')
            ->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $pdf->getContent());
        $pdf->assertHeader('Content-Disposition');

        $this->get('/api/admin/orders/export/csv')->assertUnauthorized();
    }

    public function test_customer_cannot_download_another_users_order_pdf(): void
    {
        $owner = $this->user('owner@example.test');
        $other = $this->user('other@example.test');
        $order = $this->order($owner);

        $this->postJson('/api/auth/login', ['email' => $other->email, 'password' => 'synthetic-password'])->assertOk();
        $this->getJson('/api/account/orders/'.$order->id.'/export/pdf')->assertNotFound();
    }

    public function test_admin_csv_applies_filters_and_escapes_formula_cells_without_shipping_pii(): void
    {
        $admin = $this->user('admin@example.test', admin: true);
        $admin->forceFill(['email_verified_at' => now()])->save();
        $admin->forceFill(['name' => '=HYPERLINK("https://example.test")'])->save();
        $order = $this->order($admin);
        $order->forceFill(['created_at' => now(), 'updated_at' => now()])->save();

        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'synthetic-password'])->assertOk();
        $response = $this->getJson('/api/admin/orders/export/csv?payment_status=demo_paid&created_from='.now()->format('Y-m-d'))
            ->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString('COD · chờ thu khi giao hàng', $csv);
        $this->assertStringNotContainsString('demo_paid', $csv);
        $this->assertStringNotContainsString('Địa chỉ riêng tư', $csv);
        $this->assertStringContainsString((string) $order->order_code, $csv);
    }

    public function test_unverified_order_email_contains_no_order_data_and_verified_email_contains_details(): void
    {
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        config()->set('commerce.order_admin_email', 'admin-inbox@example.test');
        $unverified = $this->user('unverified@example.test');
        $order = $this->order($unverified);
        $order->forceFill(['shipping_snapshot' => ['recipient_phone' => '0912345678', 'street' => 'Địa chỉ riêng tư']])->save();
        $order->items()->create([
            'product_name' => 'Tai nghe thử nghiệm', 'product_slug' => 'tai-nghe', 'unit_price_vnd' => 5000,
            'quantity' => 1, 'line_total_vnd' => 5000,
        ]);
        CommerceNotification::order($order, 'demo_paid', 'Đặt hàng thành công (Demo)', 'Đơn COD mô phỏng đã tạo.');

        Mail::assertSent(GenericAccountNoticeMail::class, fn (GenericAccountNoticeMail $mail): bool => $mail->hasTo($unverified->email));
        $genericBody = Mail::sent(GenericAccountNoticeMail::class)->firstOrFail()->render();
        $this->assertStringNotContainsString((string) $order->order_code, $genericBody);
        $this->assertStringNotContainsString('0912345678', $genericBody);
        $this->assertStringNotContainsString('Tai nghe thử nghiệm', $genericBody);

        $verified = $this->user('verified@example.test', verified: true);
        $verifiedOrder = $this->order($verified);
        $verifiedOrder->items()->create([
            'product_name' => 'Loa thử nghiệm', 'product_slug' => 'loa', 'unit_price_vnd' => 7000,
            'quantity' => 1, 'line_total_vnd' => 7000,
        ]);
        CommerceNotification::order($verifiedOrder, 'demo_paid', 'Đặt hàng thành công (Demo)', 'Đơn COD mô phỏng đã tạo.');

        Mail::assertSent(OrderEventMail::class, fn (OrderEventMail $mail): bool => $mail->hasTo($verified->email));
        Mail::assertSent(AdminNewOrderMail::class, fn (AdminNewOrderMail $mail): bool => $mail->hasTo('admin-inbox@example.test'));
        $adminBody = Mail::sent(AdminNewOrderMail::class)->firstOrFail()->render();
        $this->assertStringNotContainsString('Địa chỉ riêng tư', $adminBody);
    }

    public function test_smtp_failure_does_not_remove_order_and_persists_a_bounded_retry_state(): void
    {
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('smtp-failure@example.test');
        $order = $this->order($user);
        Mail::shouldReceive('to')->once()->with($user->email)->andReturn(new class
        {
            public function send(mixed $mailable): void
            {
                throw new RuntimeException('Synthetic SMTP failure');
            }
        });

        CommerceNotification::order($order, 'pending', 'Đơn đang chờ thanh toán', 'Đang chờ kết quả VNPay.');

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertDatabaseHas('customer_notifications', [
            'order_id' => $order->id,
            'email_status' => 'failed',
            'email_attempt_count' => 1,
        ]);
    }

    private function user(string $email, bool $verified = false, bool $admin = false): User
    {
        $user = User::query()->create(['name' => 'Khách hàng', 'email' => $email, 'password' => Hash::make('synthetic-password')]);
        if ($verified || $admin) {
            $user->forceFill(['email_verified_at' => now(), 'is_admin' => $admin])->save();
        }

        return $user->fresh();
    }

    private function order(User $user, string $customerName = 'Khách hàng'): Order
    {
        $order = new Order;
        $order->forceFill([
            'user_id' => $user->id, 'order_code' => 'TEST-'.strtoupper(fake()->bothify('??????')),
            'status' => 'pending', 'shipping_snapshot' => ['recipient_name' => $customerName, 'street' => 'Địa chỉ riêng tư'],
            'subtotal_vnd' => 5000, 'shipping_fee_vnd' => 0, 'grand_total_vnd' => 5000,
            'payment_method' => 'cod', 'payment_status' => 'demo_paid', 'idempotency_key' => fake()->uuid(),
        ]);
        $order->save();

        return $order;
    }
}
