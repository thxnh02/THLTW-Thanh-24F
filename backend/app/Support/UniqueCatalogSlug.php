<?php

namespace App\Support;

use Illuminate\Support\Str;

class UniqueCatalogSlug
{
    /** Reserve slugs from active and trashed rows; duplicate names get -2, -3, ... */
    public static function resolve(string $model, string $value, int $maxLength, ?int $exceptId = null): string
    {
        $base = trim(substr(Str::slug($value), 0, $maxLength), '-');
        if ($base === '') {
            return '';
        }

        for ($number = 1; ; $number++) {
            $suffix = $number === 1 ? '' : "-{$number}";
            $candidate = rtrim(substr($base, 0, $maxLength - strlen($suffix)), '-').$suffix;
            $query = $model::withTrashed()->where('slug', $candidate);
            if ($exceptId !== null) {
                $query->where('id', '!=', $exceptId);
            }
            if (! $query->exists()) {
                return $candidate;
            }
        }
    }
}
