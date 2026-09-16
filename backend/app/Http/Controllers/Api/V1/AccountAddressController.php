<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountAddressController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        return $this->success($request->user()->addresses()->latest('is_default')->latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedAddress($request);
        $address = DB::transaction(function () use ($request, $validated): Address {
            if ($validated['is_default'] ?? false) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            return $request->user()->addresses()->create($validated);
        });

        return $this->success($address, 'Da tao dia chi.', status: 201);
    }

    public function show(string $id): JsonResponse
    {
        abort(404);
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        abort_if($address->user_id !== $request->user()->id, 404);
        $validated = $this->validatedAddress($request);

        DB::transaction(function () use ($request, $address, $validated): void {
            if ($validated['is_default'] ?? false) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($validated);
        });

        return $this->success($address->refresh(), 'Da cap nhat dia chi.');
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        abort_if($address->user_id !== $request->user()->id, 404);
        $address->delete();

        return $this->success(null, 'Da xoa dia chi.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedAddress(Request $request): array
    {
        return $request->validate([
            'recipient_name' => ['required', 'string', 'max:160'],
            'phone' => ['required', 'string', 'max:30'],
            'province' => ['nullable', 'string', 'max:120'],
            'district' => ['nullable', 'string', 'max:120'],
            'ward' => ['nullable', 'string', 'max:120'],
            'address_line' => ['required', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }
}
