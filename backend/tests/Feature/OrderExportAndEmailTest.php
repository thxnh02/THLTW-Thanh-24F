<?php

namespace Tests\Feature;

use App\Jobs\DeliverOrderNotificationEmail;
use App\Mail\AdminNewOrderMail;
use App\Mail\GenericAccountNoticeMail;
use App\Mail\OrderEventMail;
use App\Models\Order;
use App\Models\User;
use App\Support\CommerceNotification;
use App\Support\OrderNotificationDelivery;
use App\Support\OrderPresentation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
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
        $cancelled = $this->order($admin);
        $cancelled->forceFill(['status' => 'cancelled', 'created_at' => now(), 'updated_at' => now()])->save();

        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'synthetic-password'])->assertOk();
        $response = $this->getJson('/api/admin/orders/export/csv?payment_status=demo_paid&created_from='.now()->format('Y-m-d'))
            ->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString('Thanh toán khi nhận hàng', $csv);
        $this->assertStringContainsString('Đơn hàng đang chờ xử lý', $csv);
        $this->assertStringContainsString('Đơn hàng đã hủy', $csv);
        $this->assertStringNotContainsString('demo_paid', $csv);
        $this->assertStringNotContainsString('Địa chỉ riêng tư', $csv);
        $this->assertStringContainsString((string) $order->order_code, $csv);
    }

    public function test_order_presentation_shows_cod_payment_due_on_delivery_and_keeps_vnpay_distinct(): void
    {
        $owner = $this->user('presentation@example.test');
        $codDemo = $this->order($owner);
        $cancelledCod = $this->order($owner);
        $cancelledCod->forceFill(['status' => 'cancelled'])->save();
        $vnpay = $this->order($owner);
        $vnpay->forceFill(['payment_method' => 'vnpay', 'payment_status' => 'paid'])->save();

        $this->assertSame('Thanh toán khi nhận hàng', OrderPresentation::paymentLabel($codDemo));
        $this->assertSame('Đơn hàng đang chờ xử lý', OrderPresentation::fulfillmentLabel($codDemo));
        $this->assertSame('Đơn hàng đã hủy', OrderPresentation::paymentLabel($cancelledCod));
        $this->assertSame('Thanh toán thành công qua VNPay', OrderPresentation::paymentLabel($vnpay));
        $pdfHtml = view('orders.pdf', ['order' => $codDemo->load(['user', 'items', 'paymentAttempts'])])->render();
        $this->assertStringContainsString('Thanh toán khi nhận hàng', $pdfHtml);
        $this->assertStringContainsString('Đơn hàng đang chờ xử lý', $pdfHtml);
        $this->assertStringContainsString('thanh toán cho nhân viên giao hàng', $pdfHtml);
    }

    public function test_unverified_order_email_contains_no_order_data_and_verified_email_contains_details(): void
    {
        Mail::fake();
        Queue::fake();
        config()->set('commerce.order_email_enabled', true);
        config()->set('commerce.order_admin_email', 'admin-inbox@example.test');
        $unverified = $this->user('unverified@example.test');
        $order = $this->order($unverified);
        $order->forceFill(['shipping_snapshot' => ['recipient_phone' => '0912345678', 'street' => 'Địa chỉ riêng tư']])->save();
        $order->items()->create([
            'product_name' => 'Tai nghe thử nghiệm', 'product_slug' => 'tai-nghe', 'unit_price_vnd' => 5000,
            'quantity' => 1, 'line_total_vnd' => 5000,
        ]);
        CommerceNotification::order($order, 'cod_placed', 'Đặt hàng thành công', 'Đơn hàng đã được ghi nhận. Bạn thanh toán khi nhận hàng.');

        Queue::assertPushed(DeliverOrderNotificationEmail::class, fn (DeliverOrderNotificationEmail $job): bool => $job->notificationId === $order->notifications()->firstOrFail()->id);
        Mail::assertNothingOutgoing();
        (new DeliverOrderNotificationEmail($order->notifications()->firstOrFail()->id))->handle(app(OrderNotificationDelivery::class));

        Mail::assertSent(GenericAccountNoticeMail::class, fn (GenericAccountNoticeMail $mail): bool => $mail->hasTo($unverified->email));
        $genericBody = Mail::sent(GenericAccountNoticeMail::class)->firstOrFail()->render();
        $this->assertStringNotContainsString((string) $order->order_code, $genericBody);
        $this->assertStringNotContainsString('0912345678', $genericBody);
        $this->assertStringNotContainsString('Tai nghe thử nghiệm', $genericBody);

        $verified = $this->user('verified@example.test', verified: true);
        $verifiedOrder = $this->order($verified);
        $verifiedOrder->forceFill(['payment_status' => 'pending'])->save();
        $verifiedOrder->items()->create([
            'product_name' => 'Loa thử nghiệm', 'product_slug' => 'loa', 'unit_price_vnd' => 7000,
            'quantity' => 1, 'line_total_vnd' => 7000,
        ]);
        CommerceNotification::order($verifiedOrder, 'cod_placed', 'Đặt hàng thành công', 'Đơn hàng đã được ghi nhận. Bạn thanh toán khi nhận hàng.');

        (new DeliverOrderNotificationEmail($verifiedOrder->notifications()->firstOrFail()->id))->handle(app(OrderNotificationDelivery::class));

        Mail::assertSent(OrderEventMail::class, fn (OrderEventMail $mail): bool => $mail->hasTo($verified->email));
        Mail::assertSent(AdminNewOrderMail::class, fn (AdminNewOrderMail $mail): bool => $mail->hasTo('admin-inbox@example.test'));
        $adminBody = Mail::sent(AdminNewOrderMail::class)->firstOrFail()->render();
        $this->assertStringNotContainsString('Địa chỉ riêng tư', $adminBody);
        $this->assertStringContainsString('Thanh toán khi nhận hàng', $adminBody);
        $customerBody = Mail::sent(OrderEventMail::class)->firstOrFail()->render();
        $this->assertStringContainsString('Thanh toán khi nhận hàng', $customerBody);
        $this->assertStringContainsString('Đơn hàng đang chờ xử lý', $customerBody);
        $this->assertStringContainsString('Bạn thanh toán khi nhận hàng.', $customerBody);
        $this->assertStringNotContainsString('mô phỏng', $customerBody);
    }

    public function test_smtp_failure_does_not_remove_order_and_persists_a_bounded_retry_state(): void
    {
        Queue::fake();
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

        (new DeliverOrderNotificationEmail($order->notifications()->firstOrFail()->id))->handle(app(OrderNotificationDelivery::class));

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertDatabaseHas('customer_notifications', [
            'order_id' => $order->id,
            'email_status' => 'failed',
            'email_attempt_count' => 1,
        ]);
    }

    public function test_new_order_notification_is_queued_once_without_synchronous_delivery(): void
    {
        Queue::fake();
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('queue@example.test');
        $order = $this->order($user);

        CommerceNotification::order($order, 'pending', 'Đơn đang chờ thanh toán', 'Đang chờ kết quả VNPay.');
        CommerceNotification::order($order, 'pending', 'Đơn đang chờ thanh toán', 'Đang chờ kết quả VNPay.');

        $notification = $order->notifications()->firstOrFail();
        Queue::assertPushed(DeliverOrderNotificationEmail::class, fn (DeliverOrderNotificationEmail $job): bool => $job->notificationId === $notification->id);
        Queue::assertPushed(DeliverOrderNotificationEmail::class, 1);
        Mail::assertNothingOutgoing();
        $this->assertSame('pending', $notification->email_status);
        $this->assertSame(0, $notification->email_attempt_count);
    }

    public function test_retry_command_dry_run_finds_pending_email_without_sending_it(): void
    {
        Queue::fake();
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('pending-email@example.test');
        $order = $this->order($user);
        $notification = $order->notifications()->create([
            'user_id' => $user->id, 'event_key' => 'order:'.$order->id.':pending', 'title' => 'Đơn hàng', 'message' => 'Đang chờ',
            'link' => '/account/orders/'.$order->id, 'email_status' => 'pending', 'email_attempt_count' => 0,
        ]);

        $this->artisan('commerce:retry-order-emails')->expectsOutputToContain('1')->assertSuccessful();

        Queue::assertNothingPushed();
        Mail::assertNothingOutgoing();
        $this->assertDatabaseHas('customer_notifications', ['id' => $notification->id, 'email_status' => 'pending']);
    }

    public function test_retry_command_execute_queues_never_attempted_pending_delivery(): void
    {
        Queue::fake();
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('execute-pending@example.test');
        $order = $this->order($user);
        $notification = $order->notifications()->create([
            'user_id' => $user->id, 'event_key' => 'order:'.$order->id.':pending', 'title' => 'Đơn hàng', 'message' => 'Đang chờ',
            'link' => '/account/orders/'.$order->id, 'email_status' => 'pending', 'email_attempt_count' => 0,
        ]);

        $this->artisan('commerce:retry-order-emails', ['--execute' => true])->expectsOutputToContain('queueing')->assertSuccessful();

        Queue::assertPushed(DeliverOrderNotificationEmail::class, fn (DeliverOrderNotificationEmail $job): bool => $job->notificationId === $notification->id && $job->retryDelivery);
        Mail::assertNothingOutgoing();
    }

    public function test_retry_command_recovers_stale_attempted_email_after_worker_restart(): void
    {
        Queue::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('stale-email@example.test');
        $order = $this->order($user);
        $notification = $order->notifications()->create([
            'user_id' => $user->id, 'event_key' => 'order:'.$order->id.':pending', 'title' => 'Đơn hàng', 'message' => 'Đang chờ',
            'link' => '/account/orders/'.$order->id, 'email_status' => 'attempted', 'email_attempt_count' => 1,
            'email_attempted_at' => now()->subSeconds(301),
        ]);

        $this->artisan('commerce:retry-order-emails')->expectsOutputToContain('1')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertDatabaseHas('customer_notifications', ['id' => $notification->id, 'email_status' => 'attempted']);
    }

    public function test_retry_command_never_reschedules_a_recipient_after_the_attempt_limit(): void
    {
        Queue::fake();
        config()->set('commerce.order_email_enabled', true);
        config()->set('commerce.order_email_max_attempts', 3);
        $user = $this->user('exhausted-email@example.test', verified: true);
        $order = $this->order($user);
        $notification = $order->notifications()->create([
            'user_id' => $user->id, 'event_key' => 'order:'.$order->id.':pending', 'title' => 'Đơn hàng', 'message' => 'Đang chờ',
            'link' => '/account/orders/'.$order->id, 'email_status' => 'failed', 'email_attempt_count' => 3,
            'email_attempted_at' => now()->subHour(),
        ]);

        $this->artisan('commerce:retry-order-emails')->expectsOutputToContain('0')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertSame('not_due', app(OrderNotificationDelivery::class)->retry($notification->id)['customer']);
        $this->assertDatabaseHas('customer_notifications', ['id' => $notification->id, 'email_status' => 'failed', 'email_attempt_count' => 3]);
    }

    public function test_duplicate_email_jobs_do_not_send_twice_after_first_delivery_is_recorded(): void
    {
        Queue::fake();
        Mail::fake();
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('deduplicate@example.test', verified: true);
        $order = $this->order($user);
        CommerceNotification::order($order, 'pending', 'Đơn đang chờ', 'Đang chờ thanh toán.');
        $notificationId = $order->notifications()->firstOrFail()->id;
        $delivery = app(OrderNotificationDelivery::class);

        (new DeliverOrderNotificationEmail($notificationId))->handle($delivery);
        (new DeliverOrderNotificationEmail($notificationId))->handle($delivery);

        Mail::assertSent(OrderEventMail::class, 1);
        $this->assertDatabaseHas('customer_notifications', ['id' => $notificationId, 'email_status' => 'sent', 'email_attempt_count' => 1]);
    }

    public function test_enqueue_failure_leaves_order_and_pending_notification_intact(): void
    {
        config()->set('commerce.order_email_enabled', true);
        $user = $this->user('queue-offline@example.test');
        $order = $this->order($user);
        $delivery = \Mockery::mock(OrderNotificationDelivery::class);
        $delivery->shouldReceive('enqueue')->once()->andThrow(new RuntimeException('Synthetic queue unavailable'));
        app()->instance(OrderNotificationDelivery::class, $delivery);

        CommerceNotification::order($order, 'pending', 'Đơn đang chờ', 'Đang chờ thanh toán.');

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertDatabaseHas('customer_notifications', [
            'order_id' => $order->id, 'email_status' => 'pending', 'email_attempt_count' => 0,
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
