<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountAddressController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        return $this->success(AddressResource::collection($request->user()->addresses()->latest('is_default')->latest('id')->get()));
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $address = DB::transaction(function () use ($request, $validated): Address {
            if ($validated['is_default'] ?? false) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            return $request->user()->addresses()->create($validated);
        });

        return $this->success(new AddressResource($address), 'Đã tạo địa chỉ.', status: 201);
    }

    public function show(string $id): JsonResponse
    {
        abort(404);
    }

    public function update(UpdateAddressRequest $request, Address $address): JsonResponse
    {
        abort_if($address->user_id !== $request->user()->id, 404);
        $validated = $request->validated();

        DB::transaction(function () use ($request, $address, $validated): void {
            if ($validated['is_default'] ?? false) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($validated);
        });

        return $this->success(new AddressResource($address->refresh()), 'Đã cập nhật địa chỉ.');
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        abort_if($address->user_id !== $request->user()->id, 404);
        $address->delete();

        return $this->success(null, 'Đã xóa địa chỉ.');
    }
}
