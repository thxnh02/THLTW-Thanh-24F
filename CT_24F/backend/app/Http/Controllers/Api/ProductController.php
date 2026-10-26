<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    private const EFFECTIVE_PRICE_SQL = 'CAST(CASE WHEN sale_price IS NOT NULL AND sale_price >= 0 AND sale_price < price THEN sale_price ELSE price END AS DECIMAL(12, 2))';

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'page' => ['sometimes', 'required', 'integer', 'min:1'],
            'category_id' => ['sometimes', 'required', 'integer', 'min:1'],
            'brand_id' => ['sometimes', 'required', 'integer', 'min:1'],
            'min_price' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'max_price' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
        ]);

        if (isset($filters['min_price'], $filters['max_price']) && (float) $filters['min_price'] > (float) $filters['max_price']) {
            throw ValidationException::withMessages(['max_price' => 'Giá đến phải lớn hơn hoặc bằng giá từ.']);
        }

        $query = $this->visibleProducts()->with(['category', 'brand']);

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (isset($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['min_price'])) {
            $query->whereRaw(self::EFFECTIVE_PRICE_SQL.' >= ?', [$filters['min_price']]);
        }
        if (isset($filters['max_price'])) {
            $query->whereRaw(self::EFFECTIVE_PRICE_SQL.' <= ?', [$filters['max_price']]);
        }

        $products = $query->orderByDesc('id')->paginate(12)->withQueryString();

        return ProductResource::collection($products);
    }

    public function priceRange(): JsonResponse
    {
        $price = self::EFFECTIVE_PRICE_SQL;
        $range = $this->visibleProducts()
            ->selectRaw("MIN({$price}) AS min_price, MAX({$price}) AS max_price")
            ->first();

        return response()->json(['data' => [
            'min_price' => $range?->min_price === null ? null : number_format((float) $range->min_price, 2, '.', ''),
            'max_price' => $range?->max_price === null ? null : number_format((float) $range->max_price, 2, '.', ''),
        ]]);
    }

    private function visibleProducts(): Builder
    {
        return Product::active()
            ->whereHas('category', fn ($query) => $query->where('status', true))
            ->where(function ($query): void {
                $query->whereNull('brand_id')->orWhereHas('brand', fn ($brand) => $brand->where('status', true));
            });
    }
}
