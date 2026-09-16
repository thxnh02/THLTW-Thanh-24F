<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PageController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Page::query()->latest('id');

        if ($request->filled('q')) {
            $query->where('title', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedPage($request);

        return $this->success(Page::create($validated), 'Da tao trang.', status: 201);
    }

    public function show(Page $page): JsonResponse
    {
        return $this->success($page);
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $validated = $this->validatedPage($request, $page);
        $page->update($validated);

        return $this->success($page->refresh(), 'Da cap nhat trang.');
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return $this->success(null, 'Da xoa trang.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPage(Request $request, ?Page $page = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:220', Rule::unique('pages', 'slug')->ignore($page?->id)],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:255'],
        ]);
        $validated['slug'] = ($validated['slug'] ?? null) ?: Str::slug($validated['title']);

        return $validated;
    }
}
