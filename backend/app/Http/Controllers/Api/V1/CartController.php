<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CartController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartForUser($request);

        return $this->success($this->cartPayload($cart));
    }

    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);
        $cart = $this->cartForUser($request);
        $variant = ProductVariant::query()->findOrFail($validated['variant_id']);

        if (! $variant->active || $variant->stock_quantity <= 0) {
            return $this->error('San pham hien khong the them vao gio.', 409);
        }

        $item = CartItem::query()->firstOrNew([
            'cart_id' => $cart->id,
            'product_variant_id' => $variant->id,
        ]);
        $item->quantity = min($variant->stock_quantity, ($item->exists ? $item->quantity : 0) + (int) $validated['quantity']);
        $item->save();

        return $this->success($this->cartPayload($cart->refresh()), 'Da them vao gio hang.', status: 201);
    }

    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->cartForUser($request);
        abort_if($item->cart_id !== $cart->id, 404);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);
        $item->load('variant');

        if ((int) $validated['quantity'] > $item->variant->stock_quantity) {
            return $this->error('So luong vuot qua ton kho.', 409);
        }

        $item->update(['quantity' => (int) $validated['quantity']]);

        return $this->success($this->cartPayload($cart->refresh()), 'Da cap nhat gio hang.');
    }

    public function deleteItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->cartForUser($request);
        abort_if($item->cart_id !== $cart->id, 404);
        $item->delete();

        return $this->success($this->cartPayload($cart->refresh()), 'Da xoa san pham khoi gio hang.');
    }

    public function merge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);
        $cart = $this->cartForUser($request);

        foreach ($validated['items'] as $line) {
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

        return $this->success($this->cartPayload($cart->refresh()), 'Da merge gio hang.');
    }

    public function quote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'promotion_code' => ['nullable', 'string', 'max:80'],
        ]);

        return $this->success($this->buildQuote($validated['items'], $validated['promotion_code'] ?? null));
    }

    public function validatePromotion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subtotal' => ['required', 'numeric', 'min:0'],
            'code' => ['required', 'string', 'max:80'],
            'email' => ['nullable', 'email', 'max:160'],
        ]);

        $promotion = $this->findUsablePromotion(
            $validated['code'],
            (float) $validated['subtotal'],
            email: $validated['email'] ?? null
        );

        if (! $promotion) {
            return $this->error('Ma khuyen mai khong hop le.', 409);
        }

        return $this->success([
            'code' => $promotion->code,
            'discount' => $this->calculateDiscount($promotion, (float) $validated['subtotal']),
        ]);
    }

    /**
     * @param  array<int, array{variant_id:int, quantity:int}>  $items
     * @return array<string, mixed>
     */
    public function buildQuote(
        array $items,
        ?string $promotionCode = null,
        ?int $userId = null,
        ?string $email = null,
        bool $lockPromotion = false
    ): array {
        $lines = [];
        $subtotal = 0.0;

        foreach ($items as $item) {
            $variant = ProductVariant::query()
                ->with(['product.images', 'product.category', 'product.brand'])
                ->findOrFail($item['variant_id']);
            $quantity = max(1, (int) $item['quantity']);
            $unitPrice = (float) ($variant->sale_price ?? $variant->price);
            $lineSubtotal = $unitPrice * $quantity;
            $subtotal += $lineSubtotal;

            $lines[] = [
                'variant_id' => $variant->id,
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name,
                'variant_name' => $variant->name,
                'sku' => $variant->sku,
                'image' => $variant->product->images->first()?->path,
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'stock_quantity' => $variant->stock_quantity,
                'subtotal' => $lineSubtotal,
            ];
        }

        $promotion = $promotionCode ? $this->findUsablePromotion($promotionCode, $subtotal, $userId, $email, $lockPromotion) : null;
        $discount = $promotion ? $this->calculateDiscount($promotion, $subtotal) : 0.0;
        $shippingFee = $subtotal >= 10000000 ? 0.0 : 30000.0;

        return [
            'items' => $lines,
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'shipping_fee' => $shippingFee,
            'grand_total' => max(0, $subtotal - $discount + $shippingFee),
            'promotion' => $promotion ? ['id' => $promotion->id, 'code' => $promotion->code, 'type' => $promotion->type] : null,
        ];
    }

    public function findUsablePromotion(
        string $code,
        float $subtotal,
        ?int $userId = null,
        ?string $email = null,
        bool $lock = false
    ): ?Promotion {
        $now = Carbon::now();

        $query = Promotion::query()
            ->where('code', strtoupper(trim($code)))
            ->where('active', true)
            ->where('min_order_amount', '<=', $subtotal)
            ->where(function ($query) use ($now): void {
                $query->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function ($query) use ($now): void {
                $query->whereNull('end_at')->orWhere('end_at', '>=', $now);
            })
            ->where(function ($query): void {
                $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit');
            });

        if ($lock) {
            $query->lockForUpdate();
        }

        $promotion = $query->first();

        if (! $promotion || ! $this->passesPerCustomerLimit($promotion, $userId, $email)) {
            return null;
        }

        return $promotion;
    }

    public function calculateDiscount(Promotion $promotion, float $subtotal): float
    {
        $discount = $promotion->type === 'percent'
            ? $subtotal * ((float) $promotion->value / 100)
            : (float) $promotion->value;

        if ($promotion->max_discount_amount !== null) {
            $discount = min($discount, (float) $promotion->max_discount_amount);
        }

        return min($discount, $subtotal);
    }

    private function passesPerCustomerLimit(Promotion $promotion, ?int $userId, ?string $email): bool
    {
        if ($promotion->usage_limit_per_user === null) {
            return true;
        }

        $usageQuery = $promotion->usages();
        $normalizedEmail = $email ? strtolower(trim($email)) : null;

        if ($userId !== null) {
            $usageQuery->where('user_id', $userId);
        } elseif ($normalizedEmail) {
            $usageQuery->where('email', $normalizedEmail);
        } else {
            return true;
        }

        return $usageQuery->count() < $promotion->usage_limit_per_user;
    }

    private function cartForUser(Request $request): Cart
    {
        return Cart::query()->firstOrCreate(['user_id' => $request->user()->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function cartPayload(Cart $cart): array
    {
        $cart->load(['items.variant.product.images']);
        $quoteItems = $cart->items->map(fn (CartItem $item): array => [
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
            'quote' => $quoteItems === [] ? null : $this->buildQuote($quoteItems),
        ];
    }
}
