<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\CartQuoteRequest;
use App\Http\Requests\MergeCartRequest;
use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Requests\ValidatePromotionRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Services\CartQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponses;

    public function __construct(private readonly CartQuoteService $cartQuoteService) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->cartPayload($this->cartForUser($request)));
    }

    public function addItem(StoreCartItemRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $cart = $this->cartForUser($request);
        $variant = ProductVariant::query()->findOrFail($validated['variant_id']);

        if (! $variant->active || $variant->stock_quantity <= 0) {
            return $this->error('Sản phẩm hiện không thể thêm vào giỏ.', 409);
        }

        $item = CartItem::query()->firstOrNew([
            'cart_id' => $cart->id,
            'product_variant_id' => $variant->id,
        ]);
        $item->quantity = min($variant->stock_quantity, ($item->exists ? $item->quantity : 0) + (int) $validated['quantity']);
        $item->save();

        return $this->success($this->cartPayload($cart->refresh()), 'Đã thêm vào giỏ hàng.', status: 201);
    }

    public function updateItem(UpdateCartItemRequest $request, CartItem $item): JsonResponse
    {
        $cart = $this->cartForUser($request);
        abort_if($item->cart_id !== $cart->id, 404);
        $validated = $request->validated();
        $item->load('variant');

        if ((int) $validated['quantity'] > $item->variant->stock_quantity) {
            return $this->error('Số lượng vượt quá tồn kho.', 409);
        }

        $item->update(['quantity' => (int) $validated['quantity']]);

        return $this->success($this->cartPayload($cart->refresh()), 'Đã cập nhật giỏ hàng.');
    }

    public function deleteItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->cartForUser($request);
        abort_if($item->cart_id !== $cart->id, 404);
        $item->delete();

        return $this->success($this->cartPayload($cart->refresh()), 'Đã xóa sản phẩm khỏi giỏ hàng.');
    }

    public function merge(MergeCartRequest $request): JsonResponse
    {
        $cart = $this->cartForUser($request);

        foreach ($request->validated()['items'] as $line) {
            $variant = ProductVariant::query()->findOrFail($line['variant_id']);

            if (! $variant->active || $variant->stock_quantity <= 0) {
                continue;
            }

            $item = CartItem::query()->firstOrNew([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id,
            ]);
            $item->quantity = min($variant->stock_quantity, ($item->exists ? $item->quantity : 0) + (int) $line['quantity']);
            $item->save();
        }

        return $this->success($this->cartPayload($cart->refresh()), 'Đã đồng bộ giỏ hàng.');
    }

    public function quote(CartQuoteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success($this->cartQuoteService->buildQuote(
            $validated['items'],
            $validated['promotion_code'] ?? null,
            $request->user()?->id,
            $validated['email'] ?? $request->user()?->email,
            shippingMethodId: $validated['shipping_method_id'] ?? null,
        ));
    }

    public function validatePromotion(ValidatePromotionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $promotion = $this->cartQuoteService->findUsablePromotion(
            $validated['code'],
            (float) $validated['subtotal'],
            $request->user()?->id,
            $validated['email'] ?? $request->user()?->email,
        );

        if (! $promotion) {
            return $this->error('Mã khuyến mãi không hợp lệ.', 409);
        }

        return $this->success([
            'code' => $promotion->code,
            'discount' => $this->cartQuoteService->calculateDiscount($promotion, (float) $validated['subtotal']),
        ]);
    }

    private function cartForUser(Request $request): Cart
    {
        return Cart::query()->firstOrCreate(['user_id' => $request->user()->id]);
    }

    /** @return array<string, mixed> */
    private function cartPayload(Cart $cart): array
    {
        $cart->load(['items.variant.product.images']);
        $items = $cart->items->map(fn (CartItem $item): array => [
            'variant_id' => $item->product_variant_id,
            'quantity' => $item->quantity,
        ])->all();

        return [
            'id' => $cart->id,
            'items' => $cart->items->map(fn (CartItem $item): array => [
                'id' => $item->id,
                'variant_id' => $item->product_variant_id,
                'product_id' => $item->variant->product_id,
                'product_name' => $item->variant->product->name,
                'variant_name' => $item->variant->name,
                'sku' => $item->variant->sku,
                'image' => $item->variant->product->images->first()?->path,
                'unit_price' => (float) ($item->variant->sale_price ?? $item->variant->price),
                'quantity' => $item->quantity,
                'stock_quantity' => $item->variant->stock_quantity,
            ])->values(),
            'quote' => $items === [] ? null : $this->cartQuoteService->buildQuote($items),
        ];
    }
}
