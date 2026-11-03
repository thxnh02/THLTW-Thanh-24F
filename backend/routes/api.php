<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminBrandController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminPaymentController;
use App\Http\Controllers\Api\Admin\AdminPostController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogImageController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommerceOptionsController;
use App\Http\Controllers\Api\CustomerAddressController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\CustomerNotificationController;
use App\Http\Controllers\Api\CustomerOrderController;
use App\Http\Controllers\Api\CustomerProfileController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\VnPayCallbackController;
use App\Http\Middleware\EnsureAdminAccess;
use App\Http\Middleware\EnsureCustomerAccountActive;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}', [CategoryController::class, 'show']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/products/price-range', [ProductController::class, 'priceRange']);
Route::get('/products/suggestions', [ProductController::class, 'suggestions']);
Route::get('/products/id/{product}', [ProductController::class, 'showById'])->whereNumber('product');
Route::get('/products/{slug}/related', [ProductController::class, 'related']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/posts', [PostController::class, 'index'])->name('public.posts.index');
Route::get('/posts/{slug}', [PostController::class, 'show'])->name('public.posts.show');
Route::get('/catalog-images/{catalogImage}', [CatalogImageController::class, 'show'])->whereNumber('catalogImage');
Route::get('/commerce/options', CommerceOptionsController::class);
Route::get('/payments/vnpay/ipn', [VnPayCallbackController::class, 'ipn'])->middleware('throttle:120,1');
Route::get('/payments/vnpay/return', [VnPayCallbackController::class, 'return'])->middleware(['auth:sanctum', EnsureCustomerAccountActive::class, 'throttle:120,1']);

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [CustomerAuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/email/verify', [CustomerAuthController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/email/resend', [CustomerAuthController::class, 'resendVerification'])->middleware('throttle:10,1');
    Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword'])->middleware('throttle:10,1');
    Route::post('/forgot-password/reset', [CustomerAuthController::class, 'resetPassword'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [CustomerAuthController::class, 'me'])->middleware(EnsureCustomerAccountActive::class);
        Route::post('/logout', [CustomerAuthController::class, 'logout']);
    });
});

Route::prefix('account')->middleware(['auth:sanctum', EnsureCustomerAccountActive::class])->group(function (): void {
    Route::get('/notifications', [CustomerNotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [CustomerNotificationController::class, 'read'])->whereNumber('notification');
    Route::get('/orders', [CustomerOrderController::class, 'index']);
    Route::post('/orders', [CustomerOrderController::class, 'checkout'])->middleware('throttle:10,1');
    Route::get('/orders/{order}', [CustomerOrderController::class, 'show'])->whereNumber('order');
    Route::post('/orders/{order}/retry-payment', [CustomerOrderController::class, 'retry'])->whereNumber('order');
    Route::post('/orders/{order}/cancel', [CustomerOrderController::class, 'cancel'])->whereNumber('order');
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'add'])->middleware('throttle:60,1');
    Route::patch('/cart/items/{product}', [CartController::class, 'update'])->whereNumber('product');
    Route::delete('/cart/items/{product}', [CartController::class, 'remove'])->whereNumber('product');
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::post('/cart/merge', [CartController::class, 'merge'])->middleware('throttle:10,1');
    Route::get('/profile', [CustomerProfileController::class, 'show']);
    Route::patch('/profile', [CustomerProfileController::class, 'update']);
    Route::post('/avatar', [CustomerProfileController::class, 'uploadAvatar'])->middleware('throttle:10,1');
    Route::delete('/avatar', [CustomerProfileController::class, 'deleteAvatar']);
    Route::post('/security/password', [CustomerProfileController::class, 'changePassword'])->middleware('throttle:5,1');
    Route::get('/addresses', [CustomerAddressController::class, 'index']);
    Route::post('/addresses', [CustomerAddressController::class, 'store']);
    Route::get('/addresses/{address}', [CustomerAddressController::class, 'show'])->whereNumber('address');
    Route::patch('/addresses/{address}', [CustomerAddressController::class, 'update'])->whereNumber('address');
    Route::delete('/addresses/{address}', [CustomerAddressController::class, 'destroy'])->whereNumber('address');
    Route::patch('/addresses/{address}/default', [CustomerAddressController::class, 'makeDefault'])->whereNumber('address');
});

// Admin catalog APIs: apiResource supplies list/show/create/update/soft-delete routes;
// the explicit routes below it handle trash, restore, and permanent deletion.
Route::prefix('admin')->group(function (): void {
    Route::post('login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', EnsureAdminAccess::class])->group(function (): void {
        Route::get('me', [AdminAuthController::class, 'me']);
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{user}', [AdminUserController::class, 'show'])->whereNumber('user');
        Route::patch('users/{user}/block', [AdminUserController::class, 'block'])->whereNumber('user');
        Route::patch('users/{user}/unblock', [AdminUserController::class, 'unblock'])->whereNumber('user');
        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show'])->whereNumber('order');
        Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->whereNumber('order');
        Route::post('orders/{order}/reconcile-payment', [AdminPaymentController::class, 'reconcile'])->whereNumber('order')->middleware('throttle:5,1');
        Route::post('orders/{order}/close-unpaid', [AdminPaymentController::class, 'closeUnpaid'])->whereNumber('order')->middleware('throttle:5,1');
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
});
