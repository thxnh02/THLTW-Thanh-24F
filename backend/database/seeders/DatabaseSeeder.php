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
                'name' => 'Quan tri vien',
                'password' => env('SEED_ADMIN_PASSWORD', 'Admin@123'),
                'phone' => '0900000001',
                'role' => 'admin',
                'status' => 'active',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => env('SEED_MEMBER_EMAIL', 'member@example.com')],
            [
                'name' => 'Khach hang demo',
                'password' => env('SEED_MEMBER_PASSWORD', 'Member@123'),
                'phone' => '0900000002',
                'role' => 'member',
                'status' => 'active',
            ],
        );

        $categories = collect(['Dien thoai', 'Laptop', 'Phu kien', 'Thiet bi am thanh', 'Dong ho thong minh'])
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
                    'short_description' => 'San pham demo chinh hang, bao hanh day du, phu hop nhu cau hoc tap va lam viec.',
                    'description' => 'Mo ta chi tiet cho '.$name.'. Du lieu nay duoc seed tu backend de frontend goi API that, khong hard-code danh sach san pham.',
                    'status' => 'active',
                    'featured' => $index % 4 === 0,
                    'sold_count' => 30 - $index,
                    'seo_title' => $name,
                    'seo_description' => 'Mua '.$name.' gia tot tai THLTW Shop.',
                ],
            );

            ProductVariant::query()->updateOrCreate(
                ['sku' => 'SKU-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)],
                [
                    'product_id' => $product->id,
                    'name' => 'Tieu chuan',
                    'attributes' => ['color' => $index % 2 === 0 ? 'Den' : 'Trang'],
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
                        'name' => 'Cao cap',
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
            ['title' => 'THLTW Shop'],
            [
                'image' => '/hero-ecommerce.svg',
                'link' => '/products',
                'sort_order' => 1,
                'active' => true,
            ],
        );

        $postCategory = PostCategory::query()->updateOrCreate(
            ['slug' => 'tin-cong-nghe'],
            ['name' => 'Tin cong nghe', 'status' => 'active'],
        );

        for ($index = 1; $index <= 4; $index++) {
            Post::query()->updateOrCreate(
                ['slug' => 'meo-mua-sam-cong-nghe-'.$index],
                [
                    'post_category_id' => $postCategory->id,
                    'title' => 'Meo mua sam cong nghe '.$index,
                    'excerpt' => 'Goi y chon san pham phu hop nhu cau va ngan sach.',
                    'content' => 'Noi dung bai viet demo phuc vu trang tin tuc ecommerce.',
                    'thumbnail' => '/product-placeholder.svg',
                    'status' => 'published',
                    'published_at' => now()->subDays($index),
                    'seo_title' => 'Meo mua sam cong nghe '.$index,
                    'seo_description' => 'Kinh nghiem mua sam cong nghe.',
                ],
            );
        }

        foreach ([
            ['Gioi thieu', 'gioi-thieu', 'THLTW Shop la website demo ecommerce cho mon Thuc hanh lap trinh web.'],
            ['Chinh sach doi tra', 'chinh-sach-doi-tra', 'Khach hang co the lien he doi tra theo dieu kien bao hanh va tinh trang san pham.'],
            ['Huong dan mua hang', 'huong-dan-mua-hang', 'Chon san pham, them vao gio hang, nhap thong tin giao hang va dat don.'],
            ['Chinh sach bao mat', 'chinh-sach-bao-mat', 'Thong tin khach hang chi duoc su dung cho muc dich xu ly don hang va cham soc khach hang.'],
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
            ['Trang chu', '/', 1],
            ['San pham', '/products', 2],
            ['Bai viet', '/posts', 3],
            ['Lien he', '/contact', 4],
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
                'name' => 'Giao hang tieu chuan',
                'description' => 'Giao hang noi dia du kien 3-5 ngay.',
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
                'name' => 'Giao hang nhanh',
                'description' => 'Uu tien xu ly va giao trong 1-2 ngay.',
                'fee' => 60000,
                'free_shipping_threshold' => 15000000,
                'estimated_days_min' => 1,
                'estimated_days_max' => 2,
                'active' => true,
                'sort_order' => 2,
            ],
        );

        foreach ([
            'website_name' => 'THLTW Shop',
            'email' => 'support@example.com',
            'phone' => '0900000000',
            'address' => 'TP. Ho Chi Minh',
            'shipping_fee' => '30000',
            'free_shipping_threshold' => '10000000',
            'low_stock_threshold' => '5',
            'return_window_days' => '7',
            'invoice_company_name' => 'THLTW Shop',
            'invoice_company_address' => 'TP. Ho Chi Minh',
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

            if (! $member || ! $variant || Order::query()->where('code', 'DEMO-ORDER-'.($index + 1))->exists()) {
                continue;
            }

            $unitPrice = (float) ($variant->sale_price ?? $variant->price);
            $order = Order::create([
                'user_id' => $member->id,
                'code' => 'DEMO-ORDER-'.($index + 1),
                'status' => $status,
                'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
                'payment_method' => 'cod',
                'customer_name' => $member->name,
                'customer_email' => $member->email,
                'customer_phone' => $member->phone ?? '0900000002',
                'shipping_address' => 'TP. Ho Chi Minh',
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
