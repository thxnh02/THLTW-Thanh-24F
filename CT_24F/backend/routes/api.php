<?php

use App\Http\Controllers\Api\Admin\AdminBrandController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);

Route::prefix('admin')->group(function (): void {
    Route::get('categories/trash', [AdminCategoryController::class, 'trash']);
    Route::get('categories/trash/{id}', [AdminCategoryController::class, 'trashedShow'])->whereNumber('id');
    Route::get('categories/options', [AdminCategoryController::class, 'options']);
    Route::post('categories/{id}/restore', [AdminCategoryController::class, 'restore'])->whereNumber('id');
    Route::delete('categories/{id}/force', [AdminCategoryController::class, 'forceDestroy'])->whereNumber('id');
    Route::apiResource('categories', AdminCategoryController::class)->whereNumber('category');
    Route::apiResource('brands', AdminBrandController::class);
    Route::post('products', [AdminProductController::class, 'store']);
});
