<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::create(['name' => 'Điện tử', 'slug' => 'dien-tu', 'description' => 'Thiết bị điện tử demo', 'sort_order' => 1, 'status' => true]);
        $phones = Category::create(['parent_id' => $electronics->id, 'name' => 'Điện thoại', 'slug' => 'dien-thoai', 'sort_order' => 1, 'status' => true]);
        $laptops = Category::create(['parent_id' => $electronics->id, 'name' => 'Laptop', 'slug' => 'laptop', 'sort_order' => 2, 'status' => true]);
        $accessories = Category::create(['name' => 'Phụ kiện', 'slug' => 'phu-kien', 'description' => 'Phụ kiện demo', 'sort_order' => 2, 'status' => true]);
        $chargers = Category::create(['parent_id' => $accessories->id, 'name' => 'Sạc và cáp', 'slug' => 'sac-va-cap', 'sort_order' => 1, 'status' => true]);

        $apple = Brand::create(['name' => 'Apple', 'slug' => 'apple', 'description' => 'Thương hiệu demo', 'sort_order' => 1, 'status' => true]);
        $samsung = Brand::create(['name' => 'Samsung', 'slug' => 'samsung', 'description' => 'Thương hiệu demo', 'sort_order' => 2, 'status' => true]);
        $asus = Brand::create(['name' => 'ASUS', 'slug' => 'asus', 'description' => 'Thương hiệu demo', 'sort_order' => 3, 'status' => true]);

        $catalog = [
            ['iPhone 15', $phones, $apple, 19990000], ['Galaxy S24', $phones, $samsung, 18490000], ['iPhone 14', $phones, $apple, 15990000], ['Galaxy A55', $phones, $samsung, 8990000],
            ['MacBook Air M3', $laptops, $apple, 26990000], ['ASUS Vivobook 15', $laptops, $asus, 14990000], ['MacBook Pro M3', $laptops, $apple, 39990000], ['ASUS Zenbook 14', $laptops, $asus, 20990000],
            ['Cáp USB-C', $chargers, $apple, 490000], ['Sạc nhanh 25W', $chargers, $samsung, 590000], ['Cáp Type-C 1m', $chargers, $samsung, 190000], ['Sạc MacBook 35W', $chargers, $apple, 1490000],
            ['Chuột không dây', $accessories, $asus, 650000], ['Bàn phím cơ', $accessories, $asus, 1290000],
        ];
        foreach ($catalog as [$name, $category, $brand, $price]) {
            Product::create(['category_id' => $category->id, 'brand_id' => $brand->id, 'name' => $name, 'slug' => Str::slug($name), 'description' => 'Sản phẩm dữ liệu mẫu dùng để học API và phân trang.', 'price' => $price, 'status' => true]);
        }
    }
}
