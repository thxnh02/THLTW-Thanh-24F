<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\User;
use App\Support\CommercePrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    private const MAX_QUANTITY = 20;

    public function index(Request $request): JsonResponse
    {
        $items = CartItem::query()->where('user_id', $request->user()->id)->with('product')->orderBy('id')->get();
        $visible = CommercePrice::visible()->whereIn('products.id', $items->pluck('product_id'))->pluck('products.id')->all();
        $subtotal = 0;
        $data = $items->map(function (CartItem $item) use ($visible, &$subtotal): array {
            $product = $item->product;
            $available = $product !== null && in_array($item->product_id, $visible) && ($product->stock_quantity === null || $product->stock_quantity >= $item->quantity);
            $price = $available ? CommercePrice::productVnd($product) : null;
            $subtotal += ($price ?? 0) * $item->quantity;

            return ['product_id' => $item->product_id, 'quantity' => $item->quantity, 'available' => $available,
                'unit_price_vnd' => $price, 'price_changed' => $price !== null && $item->unit_price_at_add_vnd !== null && (int) $item->unit_price_at_add_vnd !== $price,
                'product' => $product ? ['name' => $product->name, 'slug' => $product->slug, 'image' => $product->image, 'stock_quantity' => $product->stock_quantity] : null];
        });

        return response()->json(['data' => ['items' => $data, 'subtotal_vnd' => $subtotal]]);
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate(['product_id' => ['required', 'integer', 'min:1'], 'quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        DB::transaction(fn () => $this->set($request, (int) $data['product_id'], (int) $data['quantity'], true));

        return $this->index($request);
    }

    public function update(Request $request, int $product): JsonResponse
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        DB::transaction(fn () => $this->set($request, $product, (int) $data['quantity'], false));

        return $this->index($request);
    }

    public function remove(Request $request, int $product): JsonResponse
    {
        CartItem::query()->where('user_id', $request->user()->id)->where('product_id', $product)->delete();

        return $this->index($request);
    }

    public function clear(Request $request): JsonResponse
    {
        CartItem::query()->where('user_id', $request->user()->id)->delete();

        return $this->index($request);
    }

    public function merge(Request $request): JsonResponse
    {
        $data = $request->validate(['items' => ['required', 'array', 'max:50'], 'items.*.product_id' => ['required', 'integer', 'min:1'], 'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20']]);
        $accepted = [];
        $rejected = [];
        DB::transaction(function () use ($request, $data, &$accepted, &$rejected): void {
            User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            foreach ($data['items'] as $item) {
                try {
                    $this->set($request, (int) $item['product_id'], (int) $item['quantity'], true);
                    $accepted[] = (int) $item['product_id'];
                } catch (ValidationException) {
                    $rejected[] = (int) $item['product_id'];
                }
            }
        });
        $response = $this->index($request)->getData(true);
        $response['data']['accepted_product_ids'] = array_values(array_unique($accepted));
        $response['data']['rejected_product_ids'] = array_values(array_unique($rejected));

        return response()->json($response);
    }

    private function set(Request $request, int $productId, int $quantity, bool $add): void
    {
        User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
        $product = CommercePrice::visible()->whereKey($productId)->lockForUpdate()->first();
        if (! $product) {
            throw ValidationException::withMessages(['product_id' => 'Sản phẩm hiện không thể mua.']);
        }
        $existing = CartItem::query()->where('user_id', $request->user()->id)->where('product_id', $productId)->lockForUpdate()->first();
        if (! $add && ! $existing) {
            throw ValidationException::withMessages(['product_id' => 'Sản phẩm không có trong giỏ hàng.']);
        }
        $next = $add ? min(self::MAX_QUANTITY, ($existing?->quantity ?? 0) + $quantity) : $quantity;
        if ($product->stock_quantity !== null && $next > $product->stock_quantity) {
            throw ValidationException::withMessages(['quantity' => 'Số lượng vượt quá tồn kho.']);
        }
        $price = CommercePrice::productVnd($product);
        if ($existing) {
            $existing->quantity = $next;
            $existing->unit_price_at_add_vnd = $price;
            $existing->save();
        } else {
            CartItem::query()->create(['user_id' => $request->user()->id, 'product_id' => $productId, 'quantity' => $next, 'unit_price_at_add_vnd' => $price]);
        }
    }
}
