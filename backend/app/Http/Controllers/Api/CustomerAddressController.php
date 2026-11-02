<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerAddressResource;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->orderByDesc('id')->get();

        return response()->json(['data' => ['addresses' => CustomerAddressResource::collection($addresses)]]);
    }

    public function show(Request $request, int $address): JsonResponse
    {
        return $this->addressResponse($this->owned($request->user(), $address));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $address = DB::transaction(function () use ($request, $data): UserAddress {
            $user = $this->lockOwner($request);
            if ($user->addresses()->count() >= 10) {
                throw ValidationException::withMessages(['addresses' => 'Bạn chỉ có thể lưu tối đa 10 địa chỉ.']);
            }

            $makeDefault = (bool) ($data['make_default'] ?? false);
            unset($data['make_default']);
            if ($makeDefault) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }
            $address = $user->addresses()->create($data);
            $address->forceFill(['is_default' => $makeDefault || $user->addresses()->count() === 1])->save();

            return $address;
        });

        return $this->addressResponse($address, 201);
    }

    public function update(Request $request, int $address): JsonResponse
    {
        $data = $this->validated($request);
        $updated = DB::transaction(function () use ($request, $address, $data): UserAddress {
            $user = $this->lockOwner($request);
            $owned = $this->owned($user, $address);
            $makeDefault = (bool) ($data['make_default'] ?? false);
            unset($data['make_default']);
            if ($makeDefault) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }
            $owned->fill($data)->save();
            if ($makeDefault) {
                $owned->forceFill(['is_default' => true])->save();
            }

            return $owned;
        });

        return $this->addressResponse($updated);
    }

    public function destroy(Request $request, int $address): JsonResponse
    {
        DB::transaction(function () use ($request, $address): void {
            $user = $this->lockOwner($request);
            $owned = $this->owned($user, $address);
            $wasDefault = $owned->is_default;
            $owned->delete();
            if ($wasDefault) {
                $replacement = $user->addresses()->orderByDesc('id')->first();
                $replacement?->forceFill(['is_default' => true])->save();
            }
        });

        return response()->json(['message' => 'Đã xóa địa chỉ.']);
    }

    public function makeDefault(Request $request, int $address): JsonResponse
    {
        $updated = DB::transaction(function () use ($request, $address): UserAddress {
            $user = $this->lockOwner($request);
            $owned = $this->owned($user, $address);
            $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            $owned->forceFill(['is_default' => true])->save();

            return $owned;
        });

        return $this->addressResponse($updated);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:30'],
            'recipient_name' => ['required', 'string', 'max:150'],
            'recipient_phone' => ['required', 'string', 'regex:/^(0\d{9}|\+84\d{9})$/'],
            'province' => ['required', 'string', 'max:100'],
            'province_code' => ['nullable', 'string', 'max:20'],
            'ward' => ['required', 'string', 'max:100'],
            'ward_code' => ['nullable', 'string', 'max:20'],
            'district' => ['nullable', 'string', 'max:100'],
            'street' => ['required', 'string', 'max:200'],
            'detail' => ['nullable', 'string', 'max:200'],
            'delivery_note' => ['nullable', 'string', 'max:500'],
            'make_default' => ['sometimes', 'boolean'],
        ]);
    }

    private function lockOwner(Request $request): User
    {
        return User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
    }

    private function owned(User $user, int $address): UserAddress
    {
        return $user->addresses()->whereKey($address)->firstOrFail();
    }

    private function addressResponse(UserAddress $address, int $status = 200): JsonResponse
    {
        return response()->json(['data' => ['address' => CustomerAddressResource::make($address)]], $status);
    }
}
