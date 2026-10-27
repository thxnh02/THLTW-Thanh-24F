<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductSuggestionResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    private const EFFECTIVE_PRICE_SQL = 'CAST(CASE WHEN sale_price IS NOT NULL AND sale_price >= 0 AND sale_price < price THEN sale_price ELSE price END AS DECIMAL(12, 2))';

    private const MAX_PER_PAGE = 12;

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->merge(['q' => trim((string) $request->query('q', ''))]);
        $filters = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'required', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'required', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'category_id' => ['sometimes', 'required', 'integer', 'min:1'],
            'brand_id' => ['sometimes', 'required', 'integer', 'min:1'],
            'min_price' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'max_price' => ['sometimes', 'required', 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'],
            'sort' => ['sometimes', 'required', Rule::in(['newest', 'price_asc', 'price_desc', 'name_asc', 'relevant'])],
            'sale' => ['sometimes', 'required', 'boolean'],
            'featured' => ['sometimes', 'required', 'boolean'],
        ]);

        if (isset($filters['min_price'], $filters['max_price']) && (float) $filters['min_price'] > (float) $filters['max_price']) {
            throw ValidationException::withMessages(['max_price' => 'Giá đến phải lớn hơn hoặc bằng giá từ.']);
        }

        $search = trim((string) ($filters['q'] ?? ''));
        $sort = $filters['sort'] ?? 'newest';
        if ($sort === 'relevant' && $search === '') {
            throw ValidationException::withMessages(['sort' => 'Sắp xếp theo độ phù hợp cần có từ khóa tìm kiếm.']);
        }

        $query = $this->visibleProducts()->with(['category', 'brand']);

        if ($search !== '') {
            $this->applySearch($query, $search);
        }

        if (isset($filters['category_id'])) {
            $query->whereIn('products.category_id', $this->visibleCategoryBranch((int) $filters['category_id']));
        }
        if (isset($filters['brand_id'])) {
            $query->where('products.brand_id', $filters['brand_id']);
        }
        if (isset($filters['min_price'])) {
            $query->whereRaw(self::EFFECTIVE_PRICE_SQL.' >= ?', [$filters['min_price']]);
        }
        if (isset($filters['max_price'])) {
            $query->whereRaw(self::EFFECTIVE_PRICE_SQL.' <= ?', [$filters['max_price']]);
        }
        if (isset($filters['sale'])) {
            if (filter_var($filters['sale'], FILTER_VALIDATE_BOOLEAN)) {
                $query->whereNotNull('products.sale_price')
                    ->where('products.sale_price', '>=', 0)
                    ->whereColumn('products.sale_price', '<', 'products.price');
            } else {
                $query->where(function (Builder $saleQuery): void {
                    $saleQuery->whereNull('products.sale_price')
                        ->orWhere('products.sale_price', '<', 0)
                        ->orWhereColumn('products.sale_price', '>=', 'products.price');
                });
            }
        }
        if (isset($filters['featured'])) {
            $query->where('products.is_featured', filter_var($filters['featured'], FILTER_VALIDATE_BOOLEAN));
        }

        $this->applySort($query, $sort, $search);

        return ProductResource::collection(
            $query->paginate((int) ($filters['per_page'] ?? self::MAX_PER_PAGE))->withQueryString()
        );
    }

    public function priceRange(): JsonResponse
    {
        $price = self::EFFECTIVE_PRICE_SQL;
        $range = $this->visibleProducts()
            ->selectRaw("MIN({$price}) AS min_price, MAX({$price}) AS max_price")
            ->first();

        return response()->json(['data' => [
            'min_price' => $range?->min_price === null ? null : number_format((float) $range->min_price, 2, '.', ''),
            'max_price' => $range?->max_price === null ? null : number_format((float) $range->max_price, 2, '.', ''),
        ]]);
    }

    public function suggestions(Request $request): AnonymousResourceCollection
    {
        $request->merge(['q' => trim((string) $request->query('q', ''))]);
        $filters = $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);
        $search = trim($filters['q']);
        $query = $this->visibleProducts()->with('brand');
        $this->applySearch($query, $search);
        $this->applySort($query, 'relevant', $search);

        return ProductSuggestionResource::collection($query->limit(6)->get());
    }

    public function show(string $slug): ProductResource
    {
        $product = $this->visibleProducts()
            ->with(['category', 'brand'])
            ->where('products.slug', $slug)
            ->firstOrFail();

        return new ProductResource($product);
    }

    public function related(Request $request, string $slug): AnonymousResourceCollection
    {
        $filters = $request->validate(['limit' => ['sometimes', 'integer', 'min:1']]);
        $limit = min((int) ($filters['limit'] ?? 4), 6);
        $product = $this->visibleProducts()->where('products.slug', $slug)->firstOrFail();

        $query = $this->visibleProducts()
            ->with(['category', 'brand'])
            ->where('products.id', '!=', $product->id)
            ->where(function (Builder $query) use ($product): void {
                $query->where('products.category_id', $product->category_id);
                if ($product->brand_id !== null) {
                    $query->orWhere('products.brand_id', $product->brand_id);
                }
            });

        if ($product->brand_id !== null) {
            $query->orderByRaw(
                'CASE WHEN products.category_id = ? AND products.brand_id = ? THEN 0 WHEN products.category_id = ? THEN 1 ELSE 2 END',
                [$product->category_id, $product->brand_id, $product->category_id]
            );
        } else {
            $query->orderByRaw('CASE WHEN products.category_id = ? THEN 0 ELSE 1 END', [$product->category_id]);
        }

        return ProductResource::collection($query->orderByDesc('products.created_at')->orderByDesc('products.id')->limit($limit)->get());
    }

    private function visibleProducts(): Builder
    {
        return Product::query()
            ->active()
            ->whereHas('category', fn (Builder $query) => $query->where('status', true))
            ->where(function (Builder $query): void {
                $query->whereNull('products.brand_id')
                    ->orWhereHas('brand', fn (Builder $brand) => $brand->where('status', true));
            });
    }

    /** Include descendants for a visible parent; a visited set and hard cap bound malformed trees. */
    private function visibleCategoryBranch(int $categoryId): array
    {
        if (! Category::query()->active()->whereKey($categoryId)->exists()) {
            return [$categoryId];
        }

        $ids = [$categoryId];
        $seen = [$categoryId => true];
        $frontier = [$categoryId];
        for ($depth = 0; $depth < 20 && $frontier !== [] && count($ids) < 1000; $depth++) {
            $children = Category::query()->active()->whereIn('parent_id', $frontier)->orderBy('id')->pluck('id')->map(fn ($id): int => (int) $id)->all();
            $frontier = [];
            foreach ($children as $childId) {
                if (isset($seen[$childId])) {
                    continue;
                }
                $seen[$childId] = true;
                $ids[] = $childId;
                $frontier[] = $childId;
                if (count($ids) >= 1000) {
                    break;
                }
            }
        }

        return $ids;
    }

    private function applySearch(Builder $query, string $search): void
    {
        $literal = $this->escapeLikeWildcards(mb_strtolower($search));
        $pattern = '%'.$literal.'%';
        $query->where(function (Builder $searchQuery) use ($pattern): void {
            $searchQuery->whereRaw("LOWER(products.name) LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereRaw("LOWER(products.slug) LIKE ? ESCAPE '!'", [$pattern]);
        });
    }

    private function applySort(Builder $query, string $sort, string $search = ''): void
    {
        if ($sort === 'relevant' && $search !== '') {
            $literal = $this->escapeLikeWildcards(mb_strtolower($search));
            $query->orderByRaw(
                "CASE WHEN LOWER(products.name) = LOWER(?) THEN 0 WHEN LOWER(products.name) LIKE LOWER(?) ESCAPE '!' THEN 1 WHEN LOWER(products.slug) LIKE LOWER(?) ESCAPE '!' THEN 2 ELSE 3 END",
                [$search, $literal.'%', $literal.'%']
            );
        } elseif ($sort === 'price_asc') {
            $query->orderByRaw(self::EFFECTIVE_PRICE_SQL.' ASC');
        } elseif ($sort === 'price_desc') {
            $query->orderByRaw(self::EFFECTIVE_PRICE_SQL.' DESC');
        } elseif ($sort === 'name_asc') {
            $query->orderByRaw('LOWER(products.name) ASC');
        }

        $query->orderByDesc('products.created_at')->orderByDesc('products.id');
    }

    private function escapeLikeWildcards(string $value): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
    }
}
