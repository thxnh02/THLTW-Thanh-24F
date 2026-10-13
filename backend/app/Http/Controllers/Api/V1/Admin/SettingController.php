<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    use ApiResponses;

    public function index(): JsonResponse
    {
        return $this->success(Setting::query()->orderBy('key')->get());
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        foreach ($validated['settings'] as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'] ?? null,
                    'type' => $setting['type'],
                ],
            );
        }

        return $this->success(Setting::query()->orderBy('key')->get(), 'Đã cập nhật cấu hình.');
    }
}
