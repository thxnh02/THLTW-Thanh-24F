<?php

use App\Http\Controllers\Api\Admin\AdminBrandController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminPostController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CatalogImageController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/products/price-range', [ProductController::class, 'priceRange']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/posts', [PostController::class, 'index'])->name('public.posts.index');
Route::get('/posts/{slug}', [PostController::class, 'show'])->name('public.posts.show');
Route::get('/catalog-images/{catalogImage}', [CatalogImageController::class, 'show'])->whereNumber('catalogImage');

// Admin catalog APIs: apiResource supplies list/show/create/update/soft-delete routes;
// the explicit routes below it handle trash, restore, and permanent deletion.
Route::prefix('admin')->group(function (): void {
    // Các API quản trị hiện chưa có xác thực: chỉ chạy trong môi trường học tập nội bộ.
    Route::get('users', [AdminUserController::class, 'index']);
    Route::get('users/{user}', [AdminUserController::class, 'show'])->whereNumber('user');
    Route::patch('users/{user}/block', [AdminUserController::class, 'block'])->whereNumber('user');
    Route::patch('users/{user}/unblock', [AdminUserController::class, 'unblock'])->whereNumber('user');
    Route::get('orders', [AdminOrderController::class, 'index']);
    Route::get('orders/{order}', [AdminOrderController::class, 'show'])->whereNumber('order');
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->whereNumber('order');
    Route::get('posts/trash', [AdminPostController::class, 'trash']);
    Route::post('posts/{id}/restore', [AdminPostController::class, 'restore'])->whereNumber('id');
    Route::delete('posts/{id}/force', [AdminPostController::class, 'forceDestroy'])->whereNumber('id');
    Route::apiResource('posts', AdminPostController::class)->whereNumber('post');
    Route::get('categories/trash', [AdminCategoryController::class, 'trash']);
    Route::get('categories/trash/{id}', [AdminCategoryController::class, 'trashedShow'])->whereNumber('id');
    Route::get('categories/options', [AdminCategoryController::class, 'options']);
    Route::post('categories/{id}/restore', [AdminCategoryController::class, 'restore'])->whereNumber('id');
    Route::delete('categories/{id}/force', [AdminCategoryController::class, 'forceDestroy'])->whereNumber('id');
    Route::apiResource('categories', AdminCategoryController::class)->whereNumber('category');
    Route::get('brands/trash', [AdminBrandController::class, 'trash']);
    Route::get('brands/trash/{id}', [AdminBrandController::class, 'trashedShow'])->whereNumber('id');
    Route::get('brands/options', [AdminBrandController::class, 'options']);
    Route::post('brands/{id}/restore', [AdminBrandController::class, 'restore'])->whereNumber('id');
    Route::delete('brands/{id}/force', [AdminBrandController::class, 'forceDestroy'])->whereNumber('id');
    Route::apiResource('brands', AdminBrandController::class)->whereNumber('brand');
    Route::get('products/trash', [AdminProductController::class, 'trash']);
    Route::get('products/trash/{id}', [AdminProductController::class, 'trashedShow'])->whereNumber('id');
    Route::post('products/{id}/restore', [AdminProductController::class, 'restore'])->whereNumber('id');
    Route::delete('products/{id}/force', [AdminProductController::class, 'forceDestroy'])->whereNumber('id');
    Route::apiResource('products', AdminProductController::class)->whereNumber('product');
});
