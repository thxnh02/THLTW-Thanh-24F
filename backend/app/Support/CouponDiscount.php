<?php

namespace App\Support;

use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class CouponDiscount
{
    public static function calculate(Coupon $coupon, int $subtotal, int $userId, array $lines): int
    {
        if (! $coupon->active || ($coupon->starts_at && $coupon->starts_at->isFuture())
            || ($coupon->ends_at && $coupon->ends_at->isPast())
            || ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit)
            || $subtotal < $coupon->minimum_vnd) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không còn hiệu lực hoặc đơn hàng chưa đủ điều kiện.']);
        }

        if ($coupon->per_customer_limit !== null && Order::query()->where('user_id', $userId)
            ->where(fn ($query) => $query->where('coupon_id', $coupon->id)
                ->orWhere(fn ($legacy) => $legacy->whereNull('coupon_id')->where('coupon_code', $coupon->code)))
            ->count() >= $coupon->per_customer_limit) {
            throw ValidationException::withMessages(['coupon_code' => 'Bạn đã dùng hết số lượt cho mã này.']);
        }

        $eligibleSubtotal = $subtotal;
        if ($coupon->scope === 'specific') {
            $ids = $coupon->products()->pluck('products.id')->map(fn ($id) => (int) $id)->all();
            $eligibleSubtotal = collect($lines)->filter(fn ($line) => in_array((int) $line['product_id'], $ids, true))
                ->sum('line_total_vnd');
            if ($eligibleSubtotal <= 0) throw ValidationException::withMessages(['coupon_code' => 'Mã không áp dụng cho sản phẩm đã chọn.']);
        }

        return min($eligibleSubtotal, $coupon->type === 'percent'
            ? intdiv($eligibleSubtotal * (int) $coupon->value, 100)
            : (int) $coupon->value);
    }

    public static function find(string $code, bool $lock = false): Coupon
    {
        $query = Coupon::query()->where('code', strtoupper(trim($code)));
        if ($lock) $query->lockForUpdate();
        return $query->first() ?? throw ValidationException::withMessages(['coupon_code' => 'Không tìm thấy mã giảm giá.']);
    }
}
