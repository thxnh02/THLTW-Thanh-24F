<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'unique:brands,slug'],
            'logo' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        return $this->success(Brand::create($validated), 'Da tao thuong hieu.', status: 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        return $this->success($brand->loadCount('products'));
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'unique:brands,slug,'.$brand->id],
            'logo' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $brand->update($validated);

        return $this->success($brand->refresh(), 'Da cap nhat thuong hieu.');
    }

    public function destroy(Brand $brand): JsonResponse
    {
        if ($brand->products()->exists()) {
            return $this->error('Thuong hieu dang co san pham, khong the xoa.', 409);
        }

        $brand->delete();

        return $this->success(null, 'Da xoa thuong hieu.');
    }
}
