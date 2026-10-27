<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Replace only known starter copy or blank descriptions with product-specific copy. */
class ProductDescriptionSeeder extends Seeder
{
    private const PLACEHOLDERS = [
        'Sản phẩm dữ liệu mẫu dùng để học API và phân trang.',
        'Thiết bị công nghệ và phụ kiện được chọn lọc cho cửa hàng.',
    ];

    private const DESCRIPTIONS = [
        'iphone-17-pro' => 'iPhone 17 Pro là điện thoại cao cấp của Apple, phù hợp cho liên lạc, chụp ảnh, quay video và sử dụng ứng dụng mỗi ngày. Máy có màn hình ProMotion 6,3 inch và chip A19 Pro; cấu hình bộ nhớ cụ thể tùy phiên bản.',
        'iphone-15' => 'iPhone 15 có Dynamic Island, camera chính 48 MP và cổng USB-C. Đây là lựa chọn cho nhu cầu chụp ảnh, quay video, xem nội dung và dùng các ứng dụng hằng ngày trong hệ sinh thái Apple.',
        'iphone-14' => 'iPhone 14 trang bị màn hình Super Retina XDR 6,1 inch và hệ thống camera kép 12 MP. Sản phẩm phù hợp cho liên lạc, chụp ảnh, quay video và giải trí hằng ngày.',
        'galaxy-s24' => 'Samsung Galaxy S24 là điện thoại dòng cao cấp với màn hình Dynamic AMOLED 2X 6,2 inch và bộ tính năng Galaxy AI. Máy đáp ứng nhu cầu liên lạc, chụp ảnh, làm việc và giải trí trên Android.',
        'galaxy-a55' => 'Samsung Galaxy A55 5G có màn hình Super AMOLED 6,6 inch, camera chính 50 MP có chống rung quang học và pin 5.000 mAh. Sản phẩm phù hợp cho học tập, liên lạc, chụp ảnh và xem nội dung mỗi ngày.',
        'macbook-air-m3' => 'MacBook Air M3 sử dụng chip Apple M3 và màn hình Liquid Retina 13,6 inch. Thiết kế mỏng nhẹ phù hợp cho học tập, làm việc di động, họp trực tuyến và các tác vụ sáng tạo thường ngày.',
        'macbook-pro-m3' => 'MacBook Pro M3 kết hợp chip Apple M3 với màn hình Liquid Retina XDR, hướng đến người thường xuyên làm việc với hình ảnh, video, lập trình hoặc nhiều ứng dụng cùng lúc.',
        'asus-vivobook-15' => 'ASUS Vivobook 15 là laptop màn hình 15 inch cho công việc văn phòng, học tập và giải trí. Cấu hình bộ nhớ và bộ xử lý có thể khác nhau theo phiên bản, vui lòng đối chiếu thông tin cấu hình của sản phẩm.',
        'asus-zenbook-14' => 'ASUS Zenbook 14 là laptop gọn nhẹ, tiện mang theo khi học tập hoặc làm việc bên ngoài. Máy phù hợp cho các tác vụ văn phòng, duyệt web và họp trực tuyến; cấu hình cụ thể tùy phiên bản.',
        'cap-usb-c' => 'Cáp USB-C dùng để sạc hoặc kết nối các thiết bị có cổng USB-C tương thích. Tốc độ truyền dữ liệu và công suất sạc phụ thuộc vào thông số của cáp, bộ sạc và thiết bị đi kèm.',
        'sac-nhanh-25w' => 'Bộ sạc công suất tối đa 25 W dành cho thiết bị hỗ trợ sạc tương thích. Tốc độ sạc thực tế phụ thuộc vào thiết bị, cáp sử dụng và trạng thái pin.',
        'cap-type-c-1m' => 'Cáp Type-C dài 1 m để sạc hoặc kết nối các thiết bị tương thích. Hãy kiểm tra chuẩn truyền dữ liệu và công suất hỗ trợ của cáp trước khi dùng với thiết bị cụ thể.',
        'sac-macbook-35w' => 'Bộ sạc USB-C công suất 35 W dành cho MacBook và các thiết bị tương thích. Thiết bị nhận công suất phù hợp với khả năng hỗ trợ của máy; cần dùng cáp USB-C phù hợp.',
        'chuot-khong-day' => 'Chuột không dây giúp thao tác trên laptop hoặc máy tính để bàn gọn gàng hơn khi học tập và làm việc. Kiểm tra kiểu kết nối và yêu cầu tương thích của phiên bản sản phẩm trước khi sử dụng.',
        'ban-phim-co' => 'Bàn phím cơ sử dụng switch cơ học riêng cho từng phím, phù hợp cho việc gõ văn bản, học tập và làm việc thường xuyên. Cảm giác gõ và bố cục phím phụ thuộc vào phiên bản sản phẩm.',
    ];

    public function run(): void
    {
        DB::transaction(function (): void {
            Product::query()
                ->whereIn('slug', array_keys(self::DESCRIPTIONS))
                ->where(function ($query): void {
                    $query->whereNull('description')->orWhereIn('description', self::PLACEHOLDERS);
                })
                ->get()
                ->each(function (Product $product): void {
                    $product->description = self::DESCRIPTIONS[$product->slug];
                    $product->save();
                });
        });
    }
}
