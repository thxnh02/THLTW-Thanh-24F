<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Dữ liệu mẫu riêng cho ba màn hình quản trị mới; không chạy cùng DatabaseSeeder. */
class AdminDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $names = [
                'Nguyễn Minh An', 'Trần Gia Bảo', 'Lê Thảo Chi', 'Phạm Quốc Duy',
                'Hoàng Mỹ Hạnh', 'Vũ Đức Khang', 'Đỗ Ngọc Lan', 'Bùi Tuấn Minh',
                'Phan Hải Nam', 'Ngô Thanh Phúc', 'Lý Bảo Trâm', 'Đặng Khánh Vy',
            ];

            $users = [];
            foreach ($names as $index => $name) {
                $users[] = User::firstOrCreate(
                    ['email' => sprintf('ct24f-demo%02d@example.test', $index + 1)],
                    ['name' => $name, 'password' => null, 'blocked_at' => $index === 10 ? '2026-10-18 10:00:00' : null],
                );
            }

            // Dùng user_id + thời điểm cố định để chạy lại không tạo trùng hoặc đổi trạng thái đã chỉnh trong admin.
            $orders = [
                [0, 'pending', '2026-10-10 08:30:00'], [1, 'processing', '2026-10-10 14:20:00'],
                [2, 'delivered', '2026-10-11 09:15:00'], [3, 'pending', '2026-10-11 16:40:00'],
                [4, 'processing', '2026-10-12 10:05:00'], [5, 'delivered', '2026-10-12 18:10:00'],
                [6, 'pending', '2026-10-13 11:25:00'], [7, 'processing', '2026-10-13 15:30:00'],
                [8, 'delivered', '2026-10-14 13:50:00'], [9, 'pending', '2026-10-15 08:45:00'],
                [0, 'processing', '2026-10-16 09:30:00'], [2, 'delivered', '2026-10-16 17:20:00'],
                [4, 'pending', '2026-10-17 12:10:00'], [6, 'processing', '2026-10-18 10:40:00'],
                [8, 'pending', '2026-10-19 09:05:00'],
            ];

            foreach ($orders as [$userIndex, $status, $createdAt]) {
                Order::firstOrCreate(
                    ['user_id' => $users[$userIndex]->id, 'created_at' => $createdAt],
                    ['status' => $status],
                );
            }

            $posts = [
                ['Cách chọn tai nghe phù hợp', 'chon-tai-nghe-phu-hop', true, 'So sánh kiểu đeo, chất âm và thời lượng pin trước khi chọn tai nghe cho nhu cầu hằng ngày.'],
                ['Mẹo bảo quản pin điện thoại', 'bao-quan-pin-dien-thoai', true, 'Hạn chế nhiệt độ cao, sử dụng bộ sạc phù hợp và kiểm tra tình trạng pin định kỳ.'],
                ['Chọn laptop cho việc học', 'chon-laptop-cho-viec-hoc', true, 'Ưu tiên cấu hình đủ dùng, bàn phím thoải mái, pin tốt và trọng lượng phù hợp khi di chuyển.'],
                ['Phân biệt cáp sạc thông dụng', 'phan-biet-cap-sac-thong-dung', true, 'Kiểm tra chuẩn đầu nối và công suất hỗ trợ để chọn cáp tương thích với thiết bị.'],
                ['Vệ sinh bàn phím đúng cách', 've-sinh-ban-phim-dung-cach', false, 'Tắt thiết bị, dùng dụng cụ mềm làm sạch và tránh để chất lỏng chảy vào bàn phím.'],
                ['Những điều cần biết về màn hình', 'dieu-can-biet-ve-man-hinh', true, 'Độ phân giải, kích thước và tần số quét nên được cân nhắc theo công việc thực tế.'],
                ['Sắp xếp góc làm việc gọn hơn', 'sap-xep-goc-lam-viec', false, 'Bố trí màn hình ngang tầm mắt và sắp xếp dây cáp để bàn làm việc thoáng hơn.'],
                ['Kiểm tra phụ kiện trước khi mua', 'kiem-tra-phu-kien-truoc-khi-mua', true, 'Đối chiếu cổng kết nối, thông số và chính sách bảo hành trước khi chọn phụ kiện.'],
                ['Mẹo sử dụng chuột không dây', 'su-dung-chuot-khong-day', true, 'Chọn vị trí đặt đầu thu hợp lý và tắt chuột khi không sử dụng trong thời gian dài.'],
                ['Lưu ý khi chọn sạc nhanh', 'luu-y-khi-chon-sac-nhanh', false, 'Công suất lớn chỉ hữu ích khi thiết bị hỗ trợ; luôn chọn phụ kiện đúng chuẩn an toàn.'],
                ['Chuẩn bị thiết bị khi đi học', 'chuan-bi-thiet-bi-khi-di-hoc', true, 'Kiểm tra pin, bộ sạc và kết nối mạng trước khi mang thiết bị đến lớp.'],
                ['Cập nhật phần mềm an toàn', 'cap-nhat-phan-mem-an-toan', false, 'Sao lưu dữ liệu quan trọng và cài bản cập nhật từ nguồn chính thức.'],
            ];

            foreach ($posts as [$title, $slug, $status, $content]) {
                Post::firstOrCreate(
                    ['slug' => 'ct24f-demo-'.$slug],
                    ['title' => $title, 'content' => $content, 'status' => $status],
                );
            }
        });
    }
}
