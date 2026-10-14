<?php

namespace App\Http\Requests\Concerns;

use App\Support\UniqueCatalogSlug;

trait ResolvesCatalogSlug
{
    protected function normalizeCatalogName(): void
    {
        $name = $this->input('name');
        if (is_string($name)) {
            $this->merge(['name' => trim($name)]);
        }
    }

    protected function resolveCatalogSlug(string $model, int $maxLength, ?int $exceptId = null): void
    {
        $slug = $this->input('slug');
        if (! is_string($slug) || trim($slug) === '') {
            return;
        }

        $this->merge(['slug' => UniqueCatalogSlug::resolve($model, $slug, $maxLength, $exceptId)]);
    }
}
