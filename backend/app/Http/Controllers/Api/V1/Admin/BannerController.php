<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBannerRequest;
use App\Http\Requests\UpdateBannerRequest;
use App\Http\Resources\BannerResource;
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

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), BannerResource::class);
    }

    public function store(StoreBannerRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new BannerResource(Banner::create($validated)), 'Đã tạo banner.', status: 201);
    }

    public function show(Banner $banner): JsonResponse
    {
        return $this->success(new BannerResource($banner));
    }

    public function update(UpdateBannerRequest $request, Banner $banner): JsonResponse
    {
        $validated = $request->validated();
        $banner->update($validated);

        return $this->success(new BannerResource($banner->refresh()), 'Đã cập nhật banner.');
    }

    public function destroy(Banner $banner): JsonResponse
    {
        $banner->delete();

        return $this->success(null, 'Đã xóa banner.');
    }
}
