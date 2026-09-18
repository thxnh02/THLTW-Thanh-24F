<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAdminPermission('promotions'), 403);

        $query = Promotion::query()->withCount('usages')->latest('id');

        if ($request->filled('q')) {
            $query->where('code', 'like', '%'.strtoupper($request->string('q')->trim()->toString()).'%');
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPromotion($request);

        $promotion = Promotion::create(Arr::except($validated, ['product_ids', 'category_ids', 'brand_ids']));
        $this->syncTargets($promotion, $validated);

        return $this->success($promotion->load(['products:id,name', 'categories:id,name', 'brands:id,name']), 'Đã tạo mã khuyến mãi.', status: 201);
    }

    public function show(Promotion $promotion): JsonResponse
    {
        return $this->success($promotion->load(['products:id,name', 'categories:id,name', 'brands:id,name'])->loadCount('usages'));
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $validated = $this->validatedPromotion($request, $promotion);
        $promotion->update(Arr::except($validated, ['product_ids', 'category_ids', 'brand_ids']));
        $this->syncTargets($promotion, $validated);

        return $this->success($promotion->refresh()->load(['products:id,name', 'categories:id,name', 'brands:id,name'])->loadCount('usages'), 'Đã cập nhật mã khuyến mãi.');
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        if (
            $promotion->usages()->exists()
            || Order::query()->where('promotion_code', $promotion->code)->exists()
        ) {
            return $this->error('Mã khuyến mãi đã phát sinh giao dịch, không thể xóa.', 409);
        }

        $promotion->delete();

        return $this->success(null, 'Đã xóa mã khuyến mãi.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPromotion(Request $request, ?Promotion $promotion = null): array
    {
        $request->merge([
            'code' => strtoupper(trim((string) $request->input('code', ''))),
        ]);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:80', Rule::unique('promotions', 'code')->ignore($promotion?->id)],
            'type' => ['required', 'in:fixed,percent'],
            'applies_to' => ['nullable', 'in:all,products,categories,brands'],
            'value' => ['required', 'numeric', 'gt:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'first_order_only' => ['nullable', 'boolean'],
            'free_shipping' => ['nullable', 'boolean'],
            'min_quantity' => ['nullable', 'integer', 'min:1'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'active' => ['required', 'boolean'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'brand_ids' => ['nullable', 'array'],
            'brand_ids.*' => ['integer', 'exists:brands,id'],
        ]);
        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order_amount'] ??= 0;
        $validated['applies_to'] ??= 'all';
        $validated['first_order_only'] ??= false;
        $validated['free_shipping'] ??= false;

        if ($validated['type'] === 'percent' && (float) $validated['value'] > 100) {
            abort(422, 'Giá trị giảm theo phần trăm không được vượt quá 100.');
        }

        return $validated;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function syncTargets(Promotion $promotion, array $validated): void
    {
        $promotion->products()->sync($validated['applies_to'] === 'products' ? ($validated['product_ids'] ?? []) : []);
        $promotion->categories()->sync($validated['applies_to'] === 'categories' ? ($validated['category_ids'] ?? []) : []);
        $promotion->brands()->sync($validated['applies_to'] === 'brands' ? ($validated['brand_ids'] ?? []) : []);
    }
}
