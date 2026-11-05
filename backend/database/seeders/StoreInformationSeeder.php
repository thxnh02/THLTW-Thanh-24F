<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class StoreInformationSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            'gioi-thieu' => ['Giới thiệu', "CT_24F là cửa hàng thiết bị công nghệ và phụ kiện. Bạn có thể khám phá sản phẩm theo danh mục, thương hiệu, mức giá hoặc tìm kiếm theo nhu cầu.\n\nMỗi trang sản phẩm cung cấp thông tin giá, tình trạng còn hàng, mô tả và các sản phẩm liên quan. Nếu cần tư vấn trước khi chọn mua, hãy gửi câu hỏi qua trang Liên hệ."],
            'huong-dan-mua-hang' => ['Hướng dẫn mua hàng', "1. Tìm sản phẩm bằng ô tìm kiếm hoặc bộ lọc trong trang Sản phẩm.\n2. Mở trang chi tiết để xem thông tin, giá và số lượng còn hàng.\n3. Đăng nhập, chọn số lượng rồi thêm vào giỏ hàng hoặc chọn Mua ngay.\n4. Kiểm tra sản phẩm, chọn địa chỉ nhận hàng và nhập mã giảm giá nếu có.\n5. Chọn phương thức thanh toán đang khả dụng, kiểm tra tổng tiền và xác nhận đặt hàng.\n\nSau khi đặt, bạn có thể xem trạng thái và chi tiết trong mục Tài khoản → Đơn hàng. Với COD, bạn thanh toán khi nhận hàng. Với VNPay, hãy đợi hệ thống xác nhận kết quả thanh toán."],
            'doi-tra-va-ho-tro' => ['Đổi trả và hỗ trợ', "Nếu sản phẩm nhận được có vấn đề hoặc bạn cần hỏi về đổi trả, hãy gửi yêu cầu qua trang Liên hệ. Vui lòng cung cấp mã đơn hàng, tên sản phẩm và mô tả tình trạng để cửa hàng kiểm tra.\n\nBạn nên giữ lại sản phẩm, phụ kiện và thông tin đơn hàng trong quá trình trao đổi. Điều kiện, thời hạn và phương án xử lý cụ thể sẽ được cửa hàng xác nhận theo từng sản phẩm và đơn hàng."],
        ];
        foreach ($pages as $slug => [$title, $body]) {
            SiteContent::firstOrCreate(['type' => 'page', 'slug' => $slug], [
                'title' => $title, 'body' => $body, 'active' => true, 'sort_order' => 0,
            ]);
        }
    }
}
