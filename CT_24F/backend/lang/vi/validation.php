<?php

return [
    'required' => 'Trường :attribute là bắt buộc.',
    'string' => 'Trường :attribute phải là chuỗi ký tự.',
    'integer' => 'Trường :attribute phải là số nguyên.',
    'boolean' => 'Trường :attribute phải là đúng hoặc sai.',
    'file' => 'Trường :attribute phải là tệp tải lên.',
    'image' => 'Trường :attribute phải là hình ảnh hợp lệ.',
    'mimes' => 'Trường :attribute phải có định dạng: :values.',
    'numeric' => 'Trường :attribute phải là số.',
    'decimal' => 'Số chữ số thập phân của trường :attribute không hợp lệ (yêu cầu: :decimal).',
    'min' => [
        'numeric' => 'Trường :attribute phải lớn hơn hoặc bằng :min.',
        'string' => 'Trường :attribute phải có ít nhất :min ký tự.',
    ],
    'max' => [
        'file' => 'Trường :attribute không được lớn hơn :max KB.',
        'numeric' => 'Trường :attribute không được lớn hơn :max.',
        'string' => 'Trường :attribute không được dài quá :max ký tự.',
    ],
    'exists' => ':attribute đã chọn không tồn tại hoặc không còn khả dụng.',
    'unique' => ':attribute đã được sử dụng.',
    'lt' => [
        'numeric' => ':attribute phải nhỏ hơn :value.',
    ],
    'not_in' => ':attribute đã chọn không hợp lệ.',
    'attributes' => [
        'name' => 'tên',
        'slug' => 'đường dẫn',
        'parent_id' => 'danh mục cha',
        'category_id' => 'danh mục',
        'brand_id' => 'thương hiệu',
        'description' => 'mô tả',
        'image' => 'đường dẫn hình ảnh',
        'image_file' => 'ảnh tải lên',
        'logo' => 'đường dẫn logo',
        'logo_file' => 'logo tải lên',
        'sort_order' => 'thứ tự',
        'price' => 'giá',
        'sale_price' => 'giá khuyến mãi',
        'status' => 'trạng thái hiển thị',
    ],
];
