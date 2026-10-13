<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Brand::query()->withCount('products')->latest('id');

        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), BrandResource::class);
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new BrandResource(Brand::create($validated)), 'Đã tạo thương hiệu.', status: 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return $this->success(new BrandResource($brand->loadCount('products')));
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        $validated = $request->validated();
        $brand->update($validated);

        return $this->success(new BrandResource($brand->refresh()), 'Đã cập nhật thương hiệu.');
    }

    public function destroy(Brand $brand): JsonResponse
    {
        if ($brand->products()->exists()) {
            return $this->error('Thương hiệu đang có sản phẩm, không thể xóa.', 409);
        }

        $brand->delete();

        return $this->success(null, 'Đã xóa thương hiệu.');
    }
}
