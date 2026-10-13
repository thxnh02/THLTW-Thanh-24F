<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuRequest;
use App\Http\Requests\UpdateMenuRequest;
use App\Http\Resources\MenuResource;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    use ApiResponses;

    public function index(Request $request): JsonResponse
    {
        $query = Menu::query()->with('parent')->orderBy('sort_order')->latest('id');

        if ($request->filled('q')) {
            $query->where('label', 'like', '%'.$request->string('q')->trim()->toString().'%');
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return $this->successPaginated($query->paginate((int) $request->integer('per_page', 15)), MenuResource::class);
    }

    public function store(StoreMenuRequest $request): JsonResponse
    {
        return $this->success(
            new MenuResource(Menu::create($request->validated())->load('parent')),
            'Đã tạo menu.',
            status: 201,
        );
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->success(new MenuResource($menu->load(['parent', 'children'])));
    }

    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $menu->update($request->validated());

        return $this->success(new MenuResource($menu->refresh()->load('parent')), 'Đã cập nhật menu.');
    }

    public function destroy(Menu $menu): JsonResponse
    {
        if ($menu->children()->exists()) {
            return $this->error('Menu đang có menu con, không thể xóa.', 409);
        }

        $menu->delete();

        return $this->success(null, 'Đã xóa menu.');
    }
}
