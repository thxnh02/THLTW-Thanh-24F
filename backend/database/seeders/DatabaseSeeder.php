<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = $this->category('dien-tu', ['name' => 'Điện tử', 'description' => 'Thiết bị điện tử và công nghệ', 'sort_order' => 1, 'status' => true]);
        $phones = $this->category('dien-thoai', ['parent_id' => $electronics->id, 'name' => 'Điện thoại', 'sort_order' => 1, 'status' => true]);
        $laptops = $this->category('laptop', ['parent_id' => $electronics->id, 'name' => 'Laptop', 'sort_order' => 2, 'status' => true]);
        $accessories = $this->category('phu-kien', ['name' => 'Phụ kiện', 'description' => 'Phụ kiện công nghệ', 'sort_order' => 2, 'status' => true]);
        $chargers = $this->category('sac-va-cap', ['parent_id' => $accessories->id, 'name' => 'Sạc và cáp', 'sort_order' => 1, 'status' => true]);

        $apple = $this->brand('apple', 'Apple', 1);
        $samsung = $this->brand('samsung', 'Samsung', 2);
        $asus = $this->brand('asus', 'ASUS', 3);

        $catalog = [
            ['iPhone 15', 'iphone-15', $phones, $apple, 19990000], ['Galaxy S24', 'galaxy-s24', $phones, $samsung, 18490000],
            ['iPhone 14', 'iphone-14', $phones, $apple, 15990000], ['Galaxy A55', 'galaxy-a55', $phones, $samsung, 8990000],
            ['MacBook Air M3', 'macbook-air-m3', $laptops, $apple, 26990000], ['ASUS Vivobook 15', 'asus-vivobook-15', $laptops, $asus, 14990000],
            ['MacBook Pro M3', 'macbook-pro-m3', $laptops, $apple, 39990000], ['ASUS Zenbook 14', 'asus-zenbook-14', $laptops, $asus, 20990000],
            ['Cáp USB-C', 'cap-usb-c', $chargers, $apple, 490000], ['Sạc nhanh 25W', 'sac-nhanh-25w', $chargers, $samsung, 590000],
            ['Cáp Type-C 1m', 'cap-type-c-1m', $chargers, $samsung, 190000], ['Sạc MacBook 35W', 'sac-macbook-35w', $chargers, $apple, 1490000],
            ['Chuột không dây', 'chuot-khong-day', $accessories, $asus, 650000], ['Bàn phím cơ', 'ban-phim-co', $accessories, $asus, 1290000],
        ];

        foreach ($catalog as [$name, $slug, $category, $brand, $price]) {
            Product::withTrashed()->firstOrCreate(['slug' => $slug], ['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => $name, 'description' => 'Thiết bị công nghệ và phụ kiện được chọn lọc cho cửa hàng.', 'price' => $price, 'status' => true]);
        }

        $this->call(HomepageShowcaseSeeder::class);
        $this->call(ProductDescriptionSeeder::class);
    }

    private function category(string $slug, array $attributes): Category
    {
        return Category::withTrashed()->firstOrCreate(['slug' => $slug], $attributes);
    }

    private function brand(string $slug, string $name, int $sortOrder): Brand
    {
        return Brand::withTrashed()->firstOrCreate(['slug' => $slug], ['name' => $name, 'description' => 'Thương hiệu công nghệ', 'sort_order' => $sortOrder, 'status' => true]);
    }
}
