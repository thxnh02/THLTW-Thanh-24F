<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminInventoryController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:100']]);
        $query = StockMovement::query();
        if ($term = trim($filters['q'] ?? '')) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
            $query->whereRaw("product_name LIKE ? ESCAPE '!'", [$like]);
        }
        return $query->orderByDesc('id')->paginate(20)->withQueryString();
    }

    public function adjust(Request $request, Product $product)
    {
        $data = $request->validate(['change' => ['required', 'integer', 'not_in:0', 'between:-1000000,1000000'], 'reason' => ['required', 'string', 'min:3', 'max:180']]);
        $product = DB::transaction(function () use ($product, $data): Product {
            $locked = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            if ($locked->stock_quantity === null) throw ValidationException::withMessages(['change' => 'Sản phẩm chưa theo dõi tồn kho. Hãy đặt số lượng tồn trong phần sửa sản phẩm trước.']);
            $next = $locked->stock_quantity + (int) $data['change'];
            if ($next < 0 || $next > 4294967295) throw ValidationException::withMessages(['change' => 'Số lượng tồn sau điều chỉnh không hợp lệ.']);
            $locked->stockReason = trim($data['reason']);
            $locked->stock_quantity = $next;
            $locked->save();
            return $locked;
        });
        return response()->json(['data' => ['id' => $product->id, 'stock_quantity' => $product->stock_quantity]]);
    }
}
