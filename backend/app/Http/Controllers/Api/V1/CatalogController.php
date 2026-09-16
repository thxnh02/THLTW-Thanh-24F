<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ApiResponses;
use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Page;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    use ApiResponses;

    public function homepage(): JsonResponse
    {
        return $this->success([
            'banners' => Banner::query()->where('active', true)->orderBy('sort_order')->get(),
            'categories' => Category::query()->where('status', 'active')->orderBy('sort_order')->limit(8)->get(),
            'new_products' => $this->productList(Product::query()->latest()->limit(8)->get()),
            'best_selling_products' => $this->productList(Product::query()->orderByDesc('sold_count')->limit(8)->get()),
            'featured_products' => $this->productList(Product::query()->where('featured', true)->limit(8)->get()),
            'latest_posts' => Post::query()->with('category')->where('status', 'published')->latest('published_at')->limit(4)->get(),
        ]);
    }

    public function categories(): JsonResponse
    {
        return $this->success(Category::query()->where('status', 'active')->orderBy('sort_order')->get());
    }

    public function brands(): JsonResponse
    {
        return $this->success(Brand::query()->where('status', 'active')->orderBy('name')->get());
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['category', 'brand', 'defaultVariant', 'images'])
            ->where('status', 'active');

        $this->applyProductFilters($query, $request);

        $products = $query->paginate((int) $request->integer('per_page', 12))->withQueryString();

        return $this->success(
            collect($products->items())->map(fn (Product $product): array => $this->productPayload($product))->values(),
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

        $product->load(['category', 'brand', 'variants', 'images', 'reviews.user']);

        $related = Product::query()
            ->with(['category', 'brand', 'defaultVariant', 'images'])
            ->where('status', 'active')
            ->where('id', '!=', $product->id)
            ->where('category_id', $product->category_id)
            ->limit(4)
            ->get();

        return $this->success([
            ...$this->productPayload($product, true),
            'related_products' => $this->productList($related),
        ]);
    }

    public function postCategories(): JsonResponse
    {
        return $this->success(PostCategory::query()->where('status', 'active')->orderBy('name')->get());
    }

    public function posts(Request $request): JsonResponse
    {
        $query = Post::query()->with('category')->where('status', 'published');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $request->string('category')));
        }

        return $this->success($query->latest('published_at')->paginate(9)->withQueryString());
    }

    public function post(Post $post): JsonResponse
    {
        abort_if($post->status !== 'published', 404);

        return $this->success($post->load('category'));
    }

    public function page(Page $page): JsonResponse
    {
        abort_if($page->status !== 'published', 404);

        return $this->success($page);
    }

    public function contact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        Contact::create($validated);

        return $this->success(null, 'Tin nhan lien he da duoc ghi nhan.', status: 201);
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

    /**
     * @return array<string, mixed>
     */
    private function productPayload(Product $product, bool $full = false): array
    {
        $variant = $product->defaultVariant ?? $product->variants->first();
        $image = $product->images->first();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'short_description' => $product->short_description,
            'description' => $full ? $product->description : null,
            'status' => $product->status,
            'featured' => (bool) $product->featured,
            'sold_count' => $product->sold_count,
            'category' => $product->category,
            'brand' => $product->brand,
            'primary_image' => $image?->path,
            'images' => $product->images,
            'default_variant' => $variant,
            'variants' => $full ? $product->variants : [],
            'price' => $variant?->price,
            'sale_price' => $variant?->sale_price,
            'stock_quantity' => $variant?->stock_quantity ?? 0,
            'review_count' => $full ? $product->reviews->count() : null,
            'average_rating' => $full ? round((float) $product->reviews->avg('rating'), 1) : null,
            'reviews' => $full ? $product->reviews->map(fn ($review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'content' => $review->content,
                'user_name' => $review->user?->name,
                'created_at' => $review->created_at,
            ])->values() : [],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function productList(mixed $products): array
    {
        return $products->loadMissing(['category', 'brand', 'defaultVariant', 'images'])
            ->map(fn (Product $product): array => $this->productPayload($product))
            ->values()
            ->all();
    }
}
