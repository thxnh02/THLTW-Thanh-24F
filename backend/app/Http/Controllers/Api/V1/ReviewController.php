<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use ApiResponses;

    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['nullable', 'string', 'max:2000'],
        ]);

        $hasCompletedOrder = OrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('order', fn ($query) => $query
                ->where('user_id', $request->user()->id)
                ->where('status', 'completed'))
            ->exists();

        if (! $hasCompletedOrder) {
            return $this->error('Chi thanh vien da mua san pham trong don hoan thanh moi duoc danh gia.', 409);
        }

        $review = Review::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
            ],
            [
                'rating' => $validated['rating'],
                'content' => $validated['content'] ?? null,
                'status' => 'approved',
            ],
        );

        return $this->success($review->load('user'), 'Da gui danh gia.', status: 201);
    }
}
