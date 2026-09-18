<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        return $this->success(
            Wishlist::query()
                ->with(['product.category', 'product.brand', 'product.defaultVariant', 'product.images'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $wishlist = Wishlist::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
        ]);

        return $this->success($wishlist->load('product'), 'Đã thêm vào danh sách yêu thích.', status: 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        Wishlist::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->delete();

        return $this->success(null, 'Đã xóa khỏi danh sách yêu thích.');
    }
}
