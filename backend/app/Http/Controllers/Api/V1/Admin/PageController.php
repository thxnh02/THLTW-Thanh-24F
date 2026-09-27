<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Http\Resources\PageResource;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function store(StorePageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return $this->success(new PageResource(Page::create($validated)), 'Đã tạo trang.', status: 201);
    }

    public function show(Page $page): JsonResponse
    {
        return $this->success(new PageResource($page));
    }

    public function update(UpdatePageRequest $request, Page $page): JsonResponse
    {
        $validated = $request->validated();
        $page->update($validated);

        return $this->success(new PageResource($page->refresh()), 'Đã cập nhật trang.');
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return $this->success(null, 'Đã xóa trang.');
    }
}
