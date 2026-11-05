<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Support\CommercePrice;
use App\Support\CouponDiscount;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CouponPreviewController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'buy_now_product_id' => ['nullable', 'integer', 'min:1'],
            'buy_now_quantity' => ['required_with:buy_now_product_id', 'integer', 'min:1', 'max:20'],
        ]);
        $items = ! empty($data['buy_now_product_id'])
            ? collect([(object) ['product_id' => $data['buy_now_product_id'], 'quantity' => $data['buy_now_quantity']]])
            : CartItem::where('user_id', $request->user()->id)->get();
        if ($items->isEmpty()) throw ValidationException::withMessages(['cart' => 'Giỏ hàng đang trống.']);
        $products = CommercePrice::visible()->whereIn('products.id', $items->pluck('product_id'))->get()->keyBy('id');
        $subtotal = 0;
        $lines = [];
        foreach ($items as $item) {
            $product = $products->get($item->product_id);
            if (! $product || ($product->stock_quantity !== null && $product->stock_quantity < $item->quantity)) {
                throw ValidationException::withMessages(['cart' => 'Sản phẩm không còn bán hoặc không đủ số lượng.']);
            }
            $lineTotal = CommercePrice::productVnd($product) * $item->quantity;
            $subtotal += $lineTotal;
            $lines[] = ['product_id' => (int) $product->id, 'line_total_vnd' => $lineTotal];
            if ($subtotal > 900000000000) throw ValidationException::withMessages(['cart' => 'Tổng tiền vượt giới hạn.']);
        }
        $coupon = CouponDiscount::find($data['code']);
        return response()->json(['data' => ['code' => $coupon->code, 'subtotal_vnd' => $subtotal,
            'discount_vnd' => CouponDiscount::calculate($coupon, $subtotal, $request->user()->id, $lines)]]);
    }
}
