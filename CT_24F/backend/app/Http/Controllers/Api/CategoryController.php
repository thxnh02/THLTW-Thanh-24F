<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::active()->whereNull('parent_id')->with(['children' => fn ($query) => $query->active()->orderBy('sort_order')])->orderBy('sort_order')->get();

        return CategoryResource::collection($categories);
    }

    public function show(string $slug): CategoryResource
    {
        $category = Category::active()->where('slug', $slug)->with(['children' => fn ($query) => $query->active()->orderBy('sort_order')])->firstOrFail();

        return new CategoryResource($category);
    }
}
