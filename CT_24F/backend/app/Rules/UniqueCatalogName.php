<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

/** Tên trong cùng bảng không được trùng, kể cả bản ghi đang ở thùng rác. */
class UniqueCatalogName implements ValidationRule
{
    public function __construct(private string $model, private ?int $exceptId = null)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) === false || trim($value) === '') {
            return;
        }

        $normalizedName = Str::lower(trim($value));
        $query = $this->model::withTrashed();

        if ($this->exceptId !== null) {
            $query->where('id', '!=', $this->exceptId);
        }

        // So sánh bằng PHP để chữ hoa tiếng Việt được xử lý giống nhau trên MySQL và SQLite.
        foreach ($query->select(['id', 'name'])->lazyById(500) as $record) {
            if (Str::lower(trim($record->name)) === $normalizedName) {
                $fail('Tên này đã tồn tại, vui lòng chọn tên khác.');

                return;
            }
        }
    }
}
