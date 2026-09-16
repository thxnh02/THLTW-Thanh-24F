<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ApiResponses;

    public function index(): JsonResponse
    {
        return $this->success(Setting::query()->orderBy('key')->get());
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string', 'max:120'],
            'settings.*.value' => ['nullable', 'string', 'max:3000'],
            'settings.*.type' => ['required', 'in:string,number,boolean,json'],
        ]);

        foreach ($validated['settings'] as $setting) {
            Setting::query()->updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'] ?? null,
                    'type' => $setting['type'],
                ],
            );
        }

        return $this->success(Setting::query()->orderBy('key')->get(), 'Da cap nhat cau hinh.');
    }
}
