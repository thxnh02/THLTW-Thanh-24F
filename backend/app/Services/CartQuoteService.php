<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Promotion;
use Illuminate\Support\Carbon;

class CartQuoteService
{
    public function __construct(private readonly ShippingService $shippingService) {}

    /**
     * @param  array<int, array{variant_id:int, quantity:int}>  $items
     * @return array<string, mixed>
     */
    public function buildQuote(
        array $items,
        ?string $promotionCode = null,
        ?int $userId = null,
        ?string $email = null,
        bool $lockPromotion = false,
        ?int $shippingMethodId = null,
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
                'category_id' => $variant->product->category_id,
                'brand_id' => $variant->product->brand_id,
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

        $promotion = $promotionCode
            ? $this->findUsablePromotion($promotionCode, $subtotal, $userId, $email, $lockPromotion, $lines)
            : null;
        $discount = $promotion ? $this->calculateDiscount($promotion, $subtotal, $lines) : 0.0;
        $shipping = $this->shippingService->resolve($shippingMethodId, $subtotal);
        $shippingFee = $promotion?->free_shipping ? 0.0 : $shipping['fee'];

        return [
            'items' => $lines,
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'shipping_fee' => $shippingFee,
            'grand_total' => max(0, $subtotal - $discount + $shippingFee),
            'shipping_method' => $shipping['method'] ? [
                'id' => $shipping['method']->id,
                'name' => $shipping['method']->name,
                'code' => $shipping['method']->code,
            ] : null,
            'promotion' => $promotion ? [
                'id' => $promotion->id,
                'code' => $promotion->code,
                'type' => $promotion->type,
                'free_shipping' => $promotion->free_shipping,
            ] : null,
        ];
    }

    public function findUsablePromotion(
        string $code,
        float $subtotal,
        ?int $userId = null,
        ?string $email = null,
        bool $lock = false,
        array $lines = [],
    ): ?Promotion {
        $now = Carbon::now();
        $query = Promotion::query()
            ->where('code', strtoupper(trim($code)))
            ->where('active', true)
            ->where('min_order_amount', '<=', $subtotal)
            ->where(fn ($query) => $query->whereNull('start_at')->orWhere('start_at', '<=', $now))
            ->where(fn ($query) => $query->whereNull('end_at')->orWhere('end_at', '>=', $now))
            ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'));

        if ($lock) {
            $query->lockForUpdate();
        }

        $promotion = $query->first();

        if (! $promotion || ! $this->passesPerCustomerLimit($promotion, $userId, $email)) {
            return null;
        }

        if ($promotion->first_order_only && $this->hasPreviousOrder($userId, $email)) {
            return null;
        }

        if ($promotion->min_quantity !== null && array_sum(array_column($lines, 'quantity')) < $promotion->min_quantity) {
            return null;
        }

        if ($lines !== [] && $this->eligibleSubtotal($promotion, $lines) <= 0) {
            return null;
        }

        return $promotion;
    }

    public function calculateDiscount(Promotion $promotion, float $subtotal, array $lines = []): float
    {
        $discountableSubtotal = $lines === [] ? $subtotal : $this->eligibleSubtotal($promotion, $lines);
        $discount = $promotion->type === 'percent'
            ? $discountableSubtotal * ((float) $promotion->value / 100)
            : (float) $promotion->value;

        if ($promotion->max_discount_amount !== null) {
            $discount = min($discount, (float) $promotion->max_discount_amount);
        }

        return min($discount, $discountableSubtotal);
    }

    /** @param array<int, array<string, mixed>> $lines */
    private function eligibleSubtotal(Promotion $promotion, array $lines): float
    {
        if ($promotion->applies_to === 'all') {
            return array_sum(array_column($lines, 'subtotal'));
        }

        $promotion->loadMissing(['products:id', 'categories:id', 'brands:id']);
        $ids = match ($promotion->applies_to) {
            'products' => $promotion->products->pluck('id')->all(),
            'categories' => $promotion->categories->pluck('id')->all(),
            'brands' => $promotion->brands->pluck('id')->all(),
            default => [],
        };

        return collect($lines)->filter(function (array $line) use ($promotion, $ids): bool {
            return match ($promotion->applies_to) {
                'products' => in_array($line['product_id'], $ids, true),
                'categories' => in_array($line['category_id'], $ids, true),
                'brands' => $line['brand_id'] !== null && in_array($line['brand_id'], $ids, true),
                default => false,
            };
        })->sum('subtotal');
    }

    private function hasPreviousOrder(?int $userId, ?string $email): bool
    {
        $query = Order::query()->where('status', '!=', 'canceled');

        if ($userId !== null) {
            return $query->where('user_id', $userId)->exists();
        }

        if ($email) {
            return $query->where('customer_email', strtolower(trim($email)))->exists();
        }

        return false;
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
}
