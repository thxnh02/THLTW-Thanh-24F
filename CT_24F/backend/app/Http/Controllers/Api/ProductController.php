<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    private function visibleProducts()
    {
        return Product::active()
            ->whereHas('category', fn ($query) => $query->where('status', true))
            ->where(function ($query): void {
                $query->whereNull('brand_id')
                    ->orWhereHas('brand', fn ($brand) => $brand->where('status', true));
            })
            ->with(['category', 'brand']);
    }

    /** GET /api/products — filter, sort and server pagination for lesson 1. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->visibleProducts();
        $keyword = trim((string) $request->query('q', $request->query('keyword', '')));
        if ($keyword !== '') {
            $query->where(fn ($q) => $q->where('name', 'like', '%'.$keyword.'%')
                ->orWhere('sku', 'like', '%'.$keyword.'%'));
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->query('category_id'));
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', (int) $request->query('brand_id'));
        }
        if (is_numeric($request->query('min_price'))) {
            $query->whereRaw('COALESCE(sale_price, price) >= ?', [(float) $request->query('min_price')]);
        }
        if (is_numeric($request->query('max_price'))) {
            $query->whereRaw('COALESCE(sale_price, price) <= ?', [(float) $request->query('max_price')]);
        }
        if ($request->boolean('sale')) {
            $query->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price');
        }
        switch ($request->query('sort')) {
            case 'price_asc':
                $query->orderByRaw('COALESCE(sale_price, price) ASC')->orderBy('id');
                break;
            case 'price_desc':
                $query->orderByRaw('COALESCE(sale_price, price) DESC')->orderBy('id');
                break;
            case 'name':
                $query->orderBy('name')->orderBy('id');
                break;
            default:
                $query->orderByDesc('id');
        }

        return ProductResource::collection($query->paginate(12)->withQueryString());
    }

    /** GET /api/products/{slug} — active product detail. */
    public function show(string $slug): ProductResource
    {
        return new ProductResource(
            $this->visibleProducts()->where('slug', $slug)->firstOrFail()
        );
    }
}
