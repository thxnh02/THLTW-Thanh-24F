<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class AdminCouponController extends Controller
{
    public function index()
    {
        return Coupon::query()->with('products:id,name')->orderByDesc('id')->paginate(10);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $coupon = DB::transaction(function () use ($data): Coupon {
            $coupon = Coupon::create(collect($data)->except('product_ids')->all());
            $coupon->products()->sync($data['scope'] === 'specific' ? $data['product_ids'] : []);
            return $coupon;
        });
        return response()->json(['data' => $coupon->load('products:id,name')], 201);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $data = $this->validated($request, $coupon);
        $coupon = DB::transaction(function () use ($coupon, $data): Coupon {
            $locked = Coupon::whereKey($coupon->id)->lockForUpdate()->firstOrFail();
            $locked->update(collect($data)->except('product_ids')->all());
            $locked->products()->sync($data['scope'] === 'specific' ? $data['product_ids'] : []);
            return $locked;
        });
        return response()->json(['data' => $coupon->load('products:id,name')]);
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();
        return response()->noContent();
    }

    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);
        $request->merge(['scope' => $request->input('scope', $coupon?->scope ?? 'all')]);
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Z0-9_-]+$/', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'type' => ['required', Rule::in(['fixed', 'percent'])],
            'value' => ['required', 'integer', 'min:1', 'max:900000000000'],
            'minimum_vnd' => ['required', 'integer', 'min:0', 'max:900000000000'],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:1000000000'],
            'per_customer_limit' => ['nullable', 'integer', 'min:1', 'max:1000000000'],
            'scope' => ['required', Rule::in(['all', 'specific'])],
            'product_ids' => ['required_if:scope,specific', 'array', 'max:100'],
            'product_ids.*' => ['integer', 'distinct', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => array_filter(['nullable', 'date', $request->filled('starts_at') ? 'after_or_equal:starts_at' : null]),
            'active' => ['required', 'boolean'],
        ]);
        if ($data['type'] === 'percent' && $data['value'] > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages(['value' => 'Mức giảm phần trăm không được vượt quá 100%.']);
        }
        return $data;
    }
}
