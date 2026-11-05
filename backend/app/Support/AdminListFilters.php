<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AdminListFilters
{
    public static function apply(Request $request, Builder $query, string $nameColumn = 'name'): Builder
    {
        $data = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', 'in:0,1']]);
        if ($term = trim($data['q'] ?? '')) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
            $query->where(fn ($q) => $q->whereRaw("{$nameColumn} LIKE ? ESCAPE '!'", [$like])->orWhereRaw("slug LIKE ? ESCAPE '!'", [$like]));
        }
        if (isset($data['status'])) $query->where('status', (int) $data['status']);
        return $query;
    }
}
