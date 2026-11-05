<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\Request;

class AdminReviewController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['visibility' => ['nullable', 'in:visible,hidden'], 'q' => ['nullable', 'string', 'max:100']]);
        $query = ProductReview::query()->with(['product:id,name,slug', 'user:id,name'])->orderByDesc('id');
        if (($filters['visibility'] ?? null) === 'visible') $query->where('is_visible', true);
        if (($filters['visibility'] ?? null) === 'hidden') $query->where('is_visible', false);
        if ($term = trim($filters['q'] ?? '')) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
            $query->where(fn ($q) => $q->whereHas('product', fn ($p) => $p->whereRaw("name LIKE ? ESCAPE '!'", [$like]))
                ->orWhereHas('user', fn ($u) => $u->whereRaw("name LIKE ? ESCAPE '!'", [$like])));
        }
        return $query->paginate(10)->withQueryString();
    }

    public function update(Request $request, ProductReview $review)
    {
        $data = $request->validate(['is_visible' => ['required', 'boolean']]);
        $review->forceFill($data)->save();
        return response()->json(['data' => $review->fresh()->load(['product:id,name,slug', 'user:id,name'])]);
    }
}
