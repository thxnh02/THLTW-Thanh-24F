<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Banner::query()->orderBy('sort_order')->latest('id');

        if ($request->filled('q')) {
            $query->where('title', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedBanner($request);

        return $this->success(Banner::create($validated), 'Da tao banner.', status: 201);
    }

    public function show(Banner $banner): JsonResponse
    {
        return $this->success($banner);
    }

    public function update(Request $request, Banner $banner): JsonResponse
    {
        $validated = $this->validatedBanner($request);
        $banner->update($validated);

        return $this->success($banner->refresh(), 'Da cap nhat banner.');
    }

    public function destroy(Banner $banner): JsonResponse
    {
        $banner->delete();

        return $this->success(null, 'Da xoa banner.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedBanner(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'image' => ['required', 'string', 'max:255'],
            'link' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
        ]);
    }
}
