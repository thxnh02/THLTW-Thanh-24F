<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Product persistence, category/brand links, and soft-delete behavior for the catalog. */
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['category_id', 'brand_id', 'name', 'slug', 'description', 'image', 'price', 'sale_price', 'status', 'is_featured', 'stock_quantity'];

    public ?string $stockReason = null;

    protected static function booted(): void
    {
        static::created(function (Product $product): void {
            if ($product->stock_quantity !== null) $product->recordStock(null);
        });
        static::updated(function (Product $product): void {
            if ($product->wasChanged('stock_quantity')) $product->recordStock($product->getOriginal('stock_quantity'));
        });
    }

    private function recordStock(?int $before): void
    {
        StockMovement::create(['product_id' => $this->id, 'product_name' => $this->name,
            'before_quantity' => $before, 'after_quantity' => $this->stock_quantity,
            'reason' => $this->stockReason ?? 'Cập nhật sản phẩm', 'created_at' => now()]);
    }

    protected function casts(): array
    {
        return ['category_id' => 'integer', 'brand_id' => 'integer', 'price' => 'decimal:2', 'sale_price' => 'decimal:2', 'status' => 'boolean', 'is_featured' => 'boolean', 'stock_quantity' => 'integer'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }
}
