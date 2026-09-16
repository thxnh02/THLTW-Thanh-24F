<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->withCount('products')->orderBy('sort_order')->latest('id');

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
            'slug' => ['nullable', 'string', 'max:180', 'unique:categories,slug'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        return $this->success(Category::create($validated), 'Da tao danh muc.', status: 201);
    }

    public function show(Category $category): JsonResponse
    {
        return $this->success($category->loadCount('products'));
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'unique:categories,slug,'.$category->id],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);
        $category->update($validated);

        return $this->success($category->refresh(), 'Da cap nhat danh muc.');
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return $this->error('Danh muc dang co san pham, khong the xoa.', 409);
        }

        $category->delete();

        return $this->success(null, 'Da xoa danh muc.');
    }
}
