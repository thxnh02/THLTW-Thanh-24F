<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\CatalogImage;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

class CatalogImageService
{
    /** Save uploaded bytes in MySQL/SQLite and keep only a short media URL on the catalog row. */
    public function sync(Model $owner, string $column, ?UploadedFile $file): void
    {
        $key = $this->key($owner);
        $image = CatalogImage::query()->where($key)->first();

        if ($file !== null) {
            $image ??= new CatalogImage($key);
            $image->fill([
                'mime_type' => $file->getMimeType(),
                'byte_size' => $file->getSize(),
                'content_base64' => base64_encode($file->get()),
            ]);
            $image->save();

            $owner->update([$column => "/api/catalog-images/{$image->id}"]);

            return;
        }

        // Replacing an uploaded image with a URL (or an empty value) removes its old bytes.
        if ($image !== null && $owner->getAttribute($column) !== "/api/catalog-images/{$image->id}") {
            $image->delete();
        }
    }

    public function deleteFor(Model $owner): void
    {
        CatalogImage::query()->where($this->key($owner))->delete();
    }

    private function key(Model $owner): array
    {
        $type = match (true) {
            $owner instanceof Product => 'product',
            $owner instanceof Category => 'category',
            $owner instanceof Brand => 'brand',
            default => throw new InvalidArgumentException('Unsupported catalog image owner.'),
        };

        return ['owner_type' => $type, 'owner_id' => $owner->getKey()];
    }
}
