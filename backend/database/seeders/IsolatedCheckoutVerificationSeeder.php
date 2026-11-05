<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\Order;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/** Dữ liệu kiểm tra chỉ dành cho database SQLite riêng ở môi trường testing. */
class IsolatedCheckoutVerificationSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('testing') || config('database.default') !== 'sqlite') {
            throw new \RuntimeException('Seeder chỉ chạy trên SQLite ở môi trường testing.');
        }
        $category = Category::create(['name' => 'Thiết bị kiểm thử', 'slug' => 'thiet-bi-kiem-thu', 'status' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Tai nghe kiểm thử', 'slug' => 'tai-nghe-kiem-thu', 'price' => 100000, 'status' => true, 'stock_quantity' => 5]);
        Coupon::create(['code' => 'CHECK20', 'type' => 'percent', 'value' => 20, 'minimum_vnd' => 0, 'active' => true]);
        $customer = User::create(['name' => 'Khách kiểm thử', 'email' => 'customer@example.test', 'password' => Hash::make('Synthetic-Customer-123!')]);
        $customer->addresses()->create(['label' => 'Nhà', 'recipient_name' => 'Khách kiểm thử', 'recipient_phone' => '0900000000', 'province' => 'TP HCM', 'ward' => 'Bến Thành', 'street' => '1 Lê Lợi', 'is_default' => true]);
        $order = Order::create(['user_id' => $customer->id, 'status' => 'delivered']);
        $order->items()->create(['product_id' => $product->id, 'product_name' => $product->name, 'product_slug' => $product->slug, 'unit_price_vnd' => 100000, 'quantity' => 1, 'line_total_vnd' => 100000]);
        ProductReview::create(['user_id' => $customer->id, 'product_id' => $product->id, 'order_id' => $order->id, 'rating' => 5, 'body' => 'Sản phẩm hoạt động tốt.']);
        $admin = User::create(['name' => 'Admin kiểm thử', 'email' => 'admin@example.test', 'password' => Hash::make('Synthetic-Admin-123!')]);
        $admin->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
    }
}
