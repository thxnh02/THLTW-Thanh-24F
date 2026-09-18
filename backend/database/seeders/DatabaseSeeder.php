<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Page;
use App\Models\Payment;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@example.com')],
            [
                'name' => 'Quản trị viên',
                'password' => env('SEED_ADMIN_PASSWORD', 'Admin@123'),
                'phone' => '0900000001',
                'role' => 'admin',
                'status' => 'active',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => env('SEED_MEMBER_EMAIL', 'member@example.com')],
            [
                'name' => 'Khách hàng thành viên',
                'password' => env('SEED_MEMBER_PASSWORD', 'Member@123'),
                'phone' => '0900000002',
                'role' => 'member',
                'status' => 'active',
            ],
        );

        $categories = collect(['Điện thoại', 'Laptop', 'Phụ kiện', 'Thiết bị âm thanh', 'Đồng hồ thông minh'])
            ->map(fn (string $name, int $index): Category => Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'image' => '/product-placeholder.svg',
                    'status' => 'active',
                    'sort_order' => $index + 1,
                ],
            ));

        $brands = collect(['Apple', 'Samsung', 'Dell', 'Sony', 'Logitech'])
            ->map(fn (string $name): Brand => Brand::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'logo' => '/product-placeholder.svg',
                    'status' => 'active',
                ],
            ));

        $productNames = [
            'iPhone 16 Pro',
            'Galaxy S26 Ultra',
            'MacBook Air 15',
            'Dell XPS 14',
            'AirPods Pro 3',
            'Sony WH-1000XM6',
            'Apple Watch Series 12',
            'Logitech MX Master 4',
            'iPad Air M4',
            'Samsung Galaxy Tab S11',
            'Dell Ultrasharp 27',
            'MagSafe Battery Pack',
            'USB-C Hub 8 in 1',
            'Magic Keyboard',
            'Galaxy Buds Pro',
            'Sony Soundbar S200',
            'SmartTag Plus',
            'Logitech Mechanical Mini',
            'Mac mini M5',
            'Samsung ViewFinity 32',
            'Apple Pencil Pro',
            'Dell Inspiron 15',
            'Sony LinkBuds Fit',
            'Logitech StreamCam',
        ];

        foreach ($productNames as $index => $name) {
            $category = $categories[$index % $categories->count()];
            $brand = $brands[$index % $brands->count()];
            $price = 900000 + ($index * 650000);
            $salePrice = $index % 3 === 0 ? $price - 150000 : null;

            $product = Product::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                    'name' => $name,
                    'short_description' => 'Sản phẩm chính hãng, bảo hành đầy đủ, phù hợp nhu cầu học tập và làm việc.',
                    'description' => 'Mô tả chi tiết cho '.$name.'. Thông tin được quản lý trực tiếp từ hệ thống cửa hàng.',
                    'status' => 'active',
                    'featured' => $index % 4 === 0,
                    'sold_count' => 30 - $index,
                    'seo_title' => $name,
                    'seo_description' => 'Mua '.$name.' giá tốt tại Công Nghệ Việt.',
                ],
            );

            ProductVariant::query()->updateOrCreate(
                ['sku' => 'SKU-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)],
                [
                    'product_id' => $product->id,
                    'name' => 'Tiêu chuẩn',
                    'attributes' => ['color' => $index % 2 === 0 ? 'Đen' : 'Trắng'],
                    'price' => $price,
                    'sale_price' => $salePrice,
                    'stock_quantity' => 8 + $index,
                    'active' => true,
                    'is_default' => true,
                ],
            );

            if ($index % 5 === 0) {
                ProductVariant::query()->updateOrCreate(
                    ['sku' => 'SKU-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT).'-PRO'],
                    [
                        'product_id' => $product->id,
                        'name' => 'Cao cấp',
                        'attributes' => ['color' => 'Xanh', 'storage' => '512GB'],
                        'price' => $price + 2500000,
                        'sale_price' => null,
                        'stock_quantity' => 5 + $index,
                        'active' => true,
                        'is_default' => false,
                    ],
                );
            }

            ProductImage::query()->updateOrCreate(
                ['product_id' => $product->id, 'sort_order' => 1],
                [
                    'path' => '/product-placeholder.svg',
                    'alt_text' => $name,
                    'is_primary' => true,
                ],
            );
        }

        Banner::query()->updateOrCreate(
            ['title' => 'Công Nghệ Việt'],
            [
                'image' => '/hero-ecommerce.svg',
                'link' => '/products',
                'sort_order' => 1,
                'active' => true,
            ],
        );

        $postCategory = PostCategory::query()->updateOrCreate(
            ['slug' => 'tin-cong-nghe'],
            ['name' => 'Tin công nghệ', 'status' => 'active'],
        );

        for ($index = 1; $index <= 4; $index++) {
            Post::query()->updateOrCreate(
                ['slug' => 'meo-mua-sam-cong-nghe-'.$index],
                [
                    'post_category_id' => $postCategory->id,
                    'title' => 'Mẹo mua sắm công nghệ '.$index,
                    'excerpt' => 'Gợi ý chọn sản phẩm phù hợp nhu cầu và ngân sách.',
                    'content' => 'Nội dung bài viết cung cấp thông tin hữu ích về sản phẩm và cách sử dụng.',
                    'thumbnail' => '/product-placeholder.svg',
                    'status' => 'published',
                    'published_at' => now()->subDays($index),
                    'seo_title' => 'Mẹo mua sắm công nghệ '.$index,
                    'seo_description' => 'Kinh nghiệm mua sắm công nghệ.',
                ],
            );
        }

        foreach ([
            ['Giới thiệu', 'gioi-thieu', 'Công Nghệ Việt cung cấp sản phẩm công nghệ chính hãng và dịch vụ hỗ trợ tận tâm.'],
            ['Chính sách đổi trả', 'chinh-sach-doi-tra', 'Khách hàng có thể liên hệ đổi trả theo điều kiện bảo hành và tình trạng sản phẩm.'],
            ['Hướng dẫn mua hàng', 'huong-dan-mua-hang', 'Chọn sản phẩm, thêm vào giỏ hàng, nhập thông tin giao hàng và đặt đơn.'],
            ['Chính sách bảo mật', 'chinh-sach-bao-mat', 'Thông tin khách hàng chỉ được sử dụng cho mục đích xử lý đơn hàng và chăm sóc khách hàng.'],
        ] as [$title, $slug, $content]) {
            Page::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $title,
                    'content' => $content,
                    'status' => 'published',
                    'seo_title' => $title,
                    'seo_description' => $content,
                ],
            );
        }

        foreach ([
            ['Trang chủ', '/', 1],
            ['Sản phẩm', '/products', 2],
            ['Bài viết', '/posts', 3],
            ['Liên hệ', '/contact', 4],
        ] as [$label, $url, $sortOrder]) {
            Menu::query()->updateOrCreate(
                ['label' => $label, 'url' => $url],
                [
                    'type' => 'custom',
                    'sort_order' => $sortOrder,
                    'active' => true,
                ],
            );
        }

        Promotion::query()->updateOrCreate(
            ['code' => 'WELCOME10'],
            [
                'type' => 'percent',
                'applies_to' => 'all',
                'value' => 10,
                'min_order_amount' => 1000000,
                'max_discount_amount' => 500000,
                'first_order_only' => false,
                'free_shipping' => false,
                'start_at' => now()->subDay(),
                'end_at' => now()->addMonth(),
                'active' => true,
                'usage_limit' => 200,
                'usage_limit_per_user' => 1,
            ],
        );

        ShippingMethod::query()->updateOrCreate(
            ['code' => 'standard'],
            [
                'name' => 'Giao hàng tiêu chuẩn',
                'description' => 'Giao hàng nội địa dự kiến 3-5 ngày.',
                'fee' => 30000,
                'free_shipping_threshold' => 10000000,
                'estimated_days_min' => 3,
                'estimated_days_max' => 5,
                'active' => true,
                'sort_order' => 1,
            ],
        );

        ShippingMethod::query()->updateOrCreate(
            ['code' => 'express'],
            [
                'name' => 'Giao hàng nhanh',
                'description' => 'Ưu tiên xử lý và giao trong 1-2 ngày.',
                'fee' => 60000,
                'free_shipping_threshold' => 15000000,
                'estimated_days_min' => 1,
                'estimated_days_max' => 2,
                'active' => true,
                'sort_order' => 2,
            ],
        );

        foreach ([
            'website_name' => 'Công Nghệ Việt',
            'email' => 'support@example.com',
            'phone' => '0900000000',
            'address' => 'TP. Hồ Chí Minh',
            'shipping_fee' => '30000',
            'free_shipping_threshold' => '10000000',
            'low_stock_threshold' => '5',
            'return_window_days' => '7',
            'invoice_company_name' => 'Công Nghệ Việt',
            'invoice_company_address' => 'TP. Hồ Chí Minh',
            'invoice_company_phone' => '0900000000',
            'invoice_company_email' => 'support@example.com',
        ] as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                [
                    'value' => $value,
                    'type' => is_numeric($value) ? 'number' : 'string',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $member = User::query()->where('email', env('SEED_MEMBER_EMAIL', 'member@example.com'))->first();
        $variants = ProductVariant::query()->with('product')->limit(3)->get();
        $statuses = ['pending', 'shipping', 'completed'];

        foreach ($statuses as $index => $status) {
            $variant = $variants[$index] ?? null;

            $orderCode = 'ORD-SEED-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            if (! $member || ! $variant || Order::query()->where('code', $orderCode)->exists()) {
                continue;
            }

            $unitPrice = (float) ($variant->sale_price ?? $variant->price);
            $order = Order::create([
                'user_id' => $member->id,
                'code' => $orderCode,
                'status' => $status,
                'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
                'payment_method' => 'cod',
                'customer_name' => $member->name,
                'customer_email' => $member->email,
                'customer_phone' => $member->phone ?? '0900000002',
                'shipping_address' => 'TP. Hồ Chí Minh',
                'subtotal' => $unitPrice,
                'discount_total' => 0,
                'shipping_fee' => 30000,
                'grand_total' => $unitPrice + 30000,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $variant->product_id,
                'product_variant_id' => $variant->id,
                'product_name' => $variant->product->name,
                'variant_name' => $variant->name,
                'sku' => $variant->sku,
                'unit_price' => $unitPrice,
                'quantity' => 1,
                'subtotal' => $unitPrice,
            ]);

            $variant->decrement('stock_quantity');
            $variant->refresh();

            InventoryMovement::create([
                'product_variant_id' => $variant->id,
                'quantity_change' => -1,
                'balance_after' => $variant->stock_quantity,
                'reason' => 'seed_order',
                'source_type' => Order::class,
                'source_id' => $order->id,
            ]);

            Payment::create([
                'order_id' => $order->id,
                'method' => 'cod',
                'status' => $status === 'completed' ? 'paid' : 'pending',
                'amount' => $unitPrice + 30000,
            ]);
        }
    }
}
