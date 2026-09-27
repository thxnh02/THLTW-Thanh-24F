<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromotionRequest;
use App\Http\Requests\UpdatePromotionRequest;
use App\Http\Resources\PromotionResource;
use App\Models\Order;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

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

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), PromotionResource::class);
    }

    public function store(StorePromotionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $promotion = Promotion::create(Arr::except($validated, ['product_ids', 'category_ids', 'brand_ids']));
        $this->syncTargets($promotion, $validated);

        return $this->success(
            new PromotionResource($promotion->load(['products:id,name', 'categories:id,name', 'brands:id,name'])),
            'Đã tạo mã khuyến mãi.',
            status: 201,
        );
    }

    public function show(Promotion $promotion): JsonResponse
    {
        return $this->success(new PromotionResource($promotion->load(['products:id,name', 'categories:id,name', 'brands:id,name'])->loadCount('usages')));
    }

    public function update(UpdatePromotionRequest $request, Promotion $promotion): JsonResponse
    {
        $validated = $request->validated();
        $promotion->update(Arr::except($validated, ['product_ids', 'category_ids', 'brand_ids']));
        $this->syncTargets($promotion, $validated);

        return $this->success(
            new PromotionResource($promotion->refresh()->load(['products:id,name', 'categories:id,name', 'brands:id,name'])->loadCount('usages')),
            'Đã cập nhật mã khuyến mãi.',
        );
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        if ($promotion->usages()->exists() || Order::query()->where('promotion_code', $promotion->code)->exists()) {
            return $this->error('Mã khuyến mãi đã phát sinh giao dịch, không thể xóa.', 409);
        }

        $promotion->delete();

        return $this->success(null, 'Đã xóa mã khuyến mãi.');
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
