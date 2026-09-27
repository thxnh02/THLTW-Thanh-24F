<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    use ApiResponses;

    public function store(StoreReviewRequest $request, Product $product): JsonResponse
    {
        $validated = $request->validated();

        $hasCompletedOrder = OrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('order', fn ($query) => $query
                ->where('user_id', $request->user()->id)
                ->where('status', 'completed'))
            ->exists();

        if (! $hasCompletedOrder) {
            return $this->error('Chỉ thành viên đã mua sản phẩm trong đơn hoàn thành mới được đánh giá.', 409);
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

        return $this->success(new ReviewResource($review->load('user')), 'Đã gửi đánh giá.', status: 201);
    }
}
