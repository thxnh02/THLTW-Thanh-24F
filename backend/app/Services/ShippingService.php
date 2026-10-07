<?php

namespace App\Services;

use App\Models\ShippingMethod;
use Illuminate\Database\Eloquent\Collection;

class ShippingService
{
    /**
     * @return Collection<int, ShippingMethod>
     */
    public function activeMethods(): Collection
    {
        return ShippingMethod::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return array{method:?ShippingMethod, name:?string, fee:float}
     */
    public function resolve(?int $shippingMethodId, float $subtotal): array
    {
        $method = $shippingMethodId
            ? ShippingMethod::query()->where('active', true)->find($shippingMethodId)
            : $this->activeMethods()->first();

        if ($shippingMethodId && ! $method) {
            abort(422, 'Phương thức vận chuyển không hợp lệ hoặc đã ngừng sử dụng.');
        }

        if (! $method) {
            return [
                'method' => null,
                'name' => null,
                'fee' => $subtotal >= 10000000 ? 0.0 : 30000.0,
            ];
        }

        return [
            'method' => $method,
            'name' => $method->name,
            'fee' => $method->feeForSubtotal($subtotal),
        ];
    }
}
