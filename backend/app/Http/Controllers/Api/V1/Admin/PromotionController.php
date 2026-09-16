<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
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

        return $this->success(Promotion::create($validated), 'Da tao ma khuyen mai.', status: 201);
    }

    public function show(Promotion $promotion): JsonResponse
    {
        return $this->success($promotion->loadCount('usages'));
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        $validated = $this->validatedPromotion($request, $promotion);
        $promotion->update($validated);

        return $this->success($promotion->refresh()->loadCount('usages'), 'Da cap nhat ma khuyen mai.');
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        if (
            $promotion->usages()->exists()
            || Order::query()->where('promotion_code', $promotion->code)->exists()
        ) {
            return $this->error('Ma khuyen mai da phat sinh giao dich, khong the xoa.', 409);
        }

        $promotion->delete();

        return $this->success(null, 'Da xoa ma khuyen mai.');
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
            'value' => ['required', 'numeric', 'gt:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'active' => ['required', 'boolean'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
        ]);
        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['min_order_amount'] ??= 0;

        if ($validated['type'] === 'percent' && (float) $validated['value'] > 100) {
            abort(422, 'Gia tri giam theo phan tram khong duoc vuot qua 100.');
        }

        return $validated;
    }
}
