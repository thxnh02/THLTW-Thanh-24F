<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWishlistRequest;
use App\Http\Resources\WishlistResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        return $this->success(WishlistResource::collection(
            Wishlist::query()
                ->with(['product.category', 'product.brand', 'product.defaultVariant', 'product.images'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
        ));
    }

    public function store(StoreWishlistRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $wishlist = Wishlist::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
        ]);

        return $this->success(new WishlistResource($wishlist->load('product')), 'Đã thêm vào danh sách yêu thích.', status: 201);
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
