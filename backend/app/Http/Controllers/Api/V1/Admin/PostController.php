<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Post::query()->with('category')->latest('id');

        if ($request->filled('q')) {
            $query->where('title', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('post_category_id', $request->integer('category'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPost($request);

        return $this->success(Post::create($validated)->load('category'), 'Da tao bai viet.', status: 201);
    }

    public function show(Post $post): JsonResponse
    {
        return $this->success($post->load('category'));
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $validated = $this->validatedPost($request, $post);
        $post->update($validated);

        return $this->success($post->refresh()->load('category'), 'Da cap nhat bai viet.');
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return $this->success(null, 'Da xoa bai viet.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPost(Request $request, ?Post $post = null): array
    {
        $validated = $request->validate([
            'post_category_id' => ['nullable', 'integer', 'exists:post_categories,id'],
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:220', Rule::unique('posts', 'slug')->ignore($post?->id)],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:255'],
        ]);
        $validated['slug'] = ($validated['slug'] ?? null) ?: Str::slug($validated['title']);

        return $validated;
    }
}
