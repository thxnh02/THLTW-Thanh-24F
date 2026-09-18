<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
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

        return $this->success($query->paginate((int) $request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedMenu($request);

        return $this->success(Menu::create($validated)->load('parent'), 'Đã tạo menu.', status: 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->success($menu->load(['parent', 'children']));
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $this->validatedMenu($request, $menu);
        $menu->update($validated);

        return $this->success($menu->refresh()->load('parent'), 'Đã cập nhật menu.');
    }

    public function destroy(Menu $menu): JsonResponse
    {
        if ($menu->children()->exists()) {
            return $this->error('Menu đang có menu con, không thể xóa.', 409);
        }

        $menu->delete();

        return $this->success(null, 'Đã xóa menu.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedMenu(Request $request, ?Menu $menu = null): array
    {
        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer', 'exists:menus,id'],
            'label' => ['required', 'string', 'max:160'],
            'url' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:custom,page,category,post'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ]);

        if ($menu && (int) ($validated['parent_id'] ?? 0) === $menu->id) {
            abort(422, 'Menu cha không hợp lệ.');
        }

        return $validated;
    }
}
