<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $products = Product::active()
            ->whereHas('category', fn ($query) => $query->where('status', true))
            ->where(function ($query): void {
                $query->whereNull('brand_id')->orWhereHas('brand', fn ($brand) => $brand->where('status', true));
            })
            ->with(['category', 'brand'])
            ->orderByDesc('id')
            ->paginate(12);

        return ProductResource::collection($products);
    }
}
