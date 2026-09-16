<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\PostCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostCategoryController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = PostCategory::query()->withCount('posts')->latest('id');

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
        $validated = $this->validatedPostCategory($request);

        return $this->success(PostCategory::create($validated), 'Da tao chu de bai viet.', status: 201);
    }

    public function show(PostCategory $postCategory): JsonResponse
    {
        return $this->success($postCategory->loadCount('posts'));
    }

    public function update(Request $request, PostCategory $postCategory): JsonResponse
    {
        $validated = $this->validatedPostCategory($request, $postCategory);
        $postCategory->update($validated);

        return $this->success($postCategory->refresh()->loadCount('posts'), 'Da cap nhat chu de bai viet.');
    }

    public function destroy(PostCategory $postCategory): JsonResponse
    {
        if ($postCategory->posts()->exists()) {
            return $this->error('Chu de dang co bai viet, khong the xoa.', 409);
        }

        $postCategory->delete();

        return $this->success(null, 'Da xoa chu de bai viet.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPostCategory(Request $request, ?PostCategory $postCategory = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', Rule::unique('post_categories', 'slug')->ignore($postCategory?->id)],
            'status' => ['required', 'in:active,inactive'],
        ]);
        $validated['slug'] = ($validated['slug'] ?? null) ?: Str::slug($validated['name']);

        return $validated;
    }
}
