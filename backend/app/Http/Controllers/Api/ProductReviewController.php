<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $product = $this->visibleProduct($slug);
        $reviews = ProductReview::query()->where('product_id', $product->id)->where('is_visible', true)
            ->with('user:id,name')->latest()->paginate(10);
        $aggregate = ProductReview::query()->where('product_id', $product->id)->where('is_visible', true)
            ->selectRaw('COUNT(*) AS review_count, AVG(rating) AS average_rating')->first();
        $eligibleOrder = $request->user() ? $this->eligibleOrder($request, $product->id) : null;
        $myReview = $eligibleOrder
            ? ProductReview::query()->where('user_id', $request->user()->id)->where('product_id', $product->id)->first()
            : null;

        return response()->json(['data' => [
            'reviews' => $reviews->getCollection()->map(fn (ProductReview $review): array => $this->present($review))->values(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => (int) $aggregate->review_count,
                'average_rating' => $aggregate->average_rating === null ? null : round((float) $aggregate->average_rating, 1),
            ],
            'can_review' => $eligibleOrder !== null,
            'my_review' => $myReview ? $this->present($myReview) : null,
            'my_review_hidden' => $myReview ? ! $myReview->is_visible : false,
        ]]);
    }

    public function store(Request $request, int $product): JsonResponse
    {
        $request->merge(['body' => trim((string) $request->input('body', ''))]);
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:120'],
            'body' => ['required', 'string', 'min:10', 'max:2000'],
        ]);
        $visibleProduct = $this->visibleProductById($product);
        $eligibleOrder = $this->eligibleOrder($request, $visibleProduct->id);
        abort_unless($eligibleOrder, 403, 'Bạn cần có đơn hàng đã giao sản phẩm này mới có thể đánh giá.');

        $review = ProductReview::query()->updateOrCreate(
            ['user_id' => $request->user()->id, 'product_id' => $visibleProduct->id],
            ['order_id' => $eligibleOrder->id, 'rating' => $data['rating'], 'title' => isset($data['title']) ? trim($data['title']) : null, 'body' => $data['body']]
        );

        return response()->json(['data' => ['review' => $this->present($review->load('user:id,name'))],
            'message' => 'Đánh giá sản phẩm đã được lưu.'], $review->wasRecentlyCreated ? 201 : 200);
    }

    private function visibleProduct(string $slug): Product
    {
        return Product::query()->active()
            ->whereHas('category', fn ($query) => $query->where('status', true))
            ->where(fn ($query) => $query->whereNull('brand_id')->orWhereHas('brand', fn ($brand) => $brand->where('status', true)))
            ->where('slug', $slug)->firstOrFail();
    }

    private function visibleProductById(int $id): Product
    {
        return Product::query()->active()
            ->whereHas('category', fn ($query) => $query->where('status', true))
            ->where(fn ($query) => $query->whereNull('brand_id')->orWhereHas('brand', fn ($brand) => $brand->where('status', true)))
            ->whereKey($id)->firstOrFail();
    }

    private function eligibleOrder(Request $request, int $productId): ?Order
    {
        return Order::query()->where('user_id', $request->user()->id)->where('status', 'delivered')
            ->whereHas('items', fn ($items) => $items->where('product_id', $productId))
            ->latest('id')->first();
    }

    private function present(ProductReview $review): array
    {
        return [
            'id' => $review->id,
            'rating' => (int) $review->rating,
            'title' => $review->title,
            'body' => $review->body,
            'reviewer_name' => $review->user?->name ?? 'Khách hàng',
            'created_at' => $review->created_at,
        ];
    }
}
