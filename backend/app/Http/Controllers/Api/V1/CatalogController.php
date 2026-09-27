<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Resources\BannerResource;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\PageResource;
use App\Http\Resources\PostCategoryResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\ProductResource;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Page;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    use ApiResponses;

    public function homepage(): JsonResponse
    {
        return $this->success([
            'banners' => BannerResource::collection(Banner::query()->where('active', true)->orderBy('sort_order')->get()),
            'categories' => CategoryResource::collection(Category::query()->where('status', 'active')->orderBy('sort_order')->limit(8)->get()),
            'new_products' => ProductResource::collection($this->homepageProducts()->latest()->limit(8)->get()),
            'best_selling_products' => ProductResource::collection($this->homepageProducts()->orderByDesc('sold_count')->limit(8)->get()),
            'featured_products' => ProductResource::collection($this->homepageProducts()->where('featured', true)->limit(8)->get()),
            'latest_posts' => PostResource::collection(Post::query()->with('category')->where('status', 'published')->latest('published_at')->limit(4)->get()),
        ]);
    }

    public function publicSettings(): JsonResponse
    {
        $values = Setting::query()->whereIn('key', [
            'website_name', 'logo', 'favicon', 'email', 'phone', 'address',
            'social_facebook', 'social_instagram', 'social_tiktok', 'seo_title', 'seo_description',
        ])->pluck('value', 'key');

        return $this->success([
            'store_name' => $values->get('website_name'),
            'logo' => $values->get('logo'),
            'favicon' => $values->get('favicon'),
            'email' => $values->get('email'),
            'phone' => $values->get('phone'),
            'address' => $values->get('address'),
            'social_facebook' => $values->get('social_facebook'),
            'social_instagram' => $values->get('social_instagram'),
            'social_tiktok' => $values->get('social_tiktok'),
            'seo_title' => $values->get('seo_title'),
            'seo_description' => $values->get('seo_description'),
            'vnpay_enabled' => filled(config('services.vnpay.tmn_code')) && filled(config('services.vnpay.hash_secret')),
        ]);
    }

    public function categories(): JsonResponse
    {
        return $this->success(CategoryResource::collection(Category::query()->where('status', 'active')->orderBy('sort_order')->get()));
    }

    public function brands(): JsonResponse
    {
        return $this->success(BrandResource::collection(Brand::query()->where('status', 'active')->orderBy('name')->get()));
    }

    public function products(Request $request): JsonResponse
    {
        $query = $this->productQuery()->where('status', 'active');
        $this->applyProductFilters($query, $request);
        $products = $query->paginate((int) $request->integer('per_page', 12))->withQueryString();

        return $this->success(
            ProductResource::collection($products->getCollection())->resolve($request),
            'Products loaded',
            [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        );
    }

    public function search(Request $request): JsonResponse
    {
        $request->merge(['q' => $request->string('q')->trim()->toString()]);

        return $this->products($request);
    }

    public function product(Product $product): JsonResponse
    {
        abort_if($product->status !== 'active', 404);

        $product->load(['category', 'brand', 'variants', 'images', 'reviews.user'])
            ->loadCount('reviews')
            ->loadAvg('reviews', 'rating');

        $related = $this->productQuery()
            ->where('status', 'active')
            ->where('id', '!=', $product->id)
            ->where('category_id', $product->category_id)
            ->limit(4)
            ->get();
        $product->setRelation('related_products', $related);

        return $this->success(new ProductResource($product));
    }

    public function postCategories(): JsonResponse
    {
        return $this->success(PostCategoryResource::collection(PostCategory::query()->where('status', 'active')->orderBy('name')->get()));
    }

    public function posts(Request $request): JsonResponse
    {
        $query = Post::query()->with('category')->where('status', 'published');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $request->string('category')));
        }

        return $this->successPaginated($query->latest('published_at')->paginate((int) $request->integer('per_page', 9))->withQueryString(), PostResource::class);
    }

    public function post(Post $post): JsonResponse
    {
        abort_if($post->status !== 'published', 404);

        return $this->success(new PostResource($post->load('category')));
    }

    public function page(Page $page): JsonResponse
    {
        abort_if($page->status !== 'published', 404);

        return $this->success(new PageResource($page));
    }

    public function contact(StoreContactRequest $request): JsonResponse
    {
        Contact::create($request->validated());

        return $this->success(null, 'Tin nhắn liên hệ đã được ghi nhận.', status: 201);
    }

    private function productQuery(): mixed
    {
        return Product::query()
            ->with(['category', 'brand', 'defaultVariant', 'images'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating');
    }

    private function homepageProducts(): mixed
    {
        return $this->productQuery();
    }

    private function applyProductFilters(mixed $query, Request $request): void
    {
        if ($request->filled('q')) {
            $keyword = '%'.$request->string('q')->trim()->toString().'%';
            $query->where(function ($query) use ($keyword): void {
                $query->where('name', 'like', $keyword)
                    ->orWhere('short_description', 'like', $keyword)
                    ->orWhere('description', 'like', $keyword)
                    ->orWhereHas('variants', fn ($variantQuery) => $variantQuery->where('sku', 'like', $keyword));
            });
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $request->string('category')));
        }

        if ($request->filled('brand')) {
            $query->whereHas('brand', fn ($brandQuery) => $brandQuery->where('slug', $request->string('brand')));
        }

        if ($request->filled('min_price')) {
            $query->whereHas('variants', fn ($variantQuery) => $variantQuery->whereRaw('COALESCE(sale_price, price) >= ?', [(float) $request->input('min_price')]));
        }

        if ($request->filled('max_price')) {
            $query->whereHas('variants', fn ($variantQuery) => $variantQuery->whereRaw('COALESCE(sale_price, price) <= ?', [(float) $request->input('max_price')]));
        }

        match ($request->input('sort', 'newest')) {
            'price_asc' => $query->orderBy(ProductVariant::selectRaw('MIN(COALESCE(sale_price, price))')->whereColumn('product_variants.product_id', 'products.id')),
            'price_desc' => $query->orderByDesc(ProductVariant::selectRaw('MIN(COALESCE(sale_price, price))')->whereColumn('product_variants.product_id', 'products.id')),
            'best_selling' => $query->orderByDesc('sold_count'),
            default => $query->latest(),
        };
    }
}
