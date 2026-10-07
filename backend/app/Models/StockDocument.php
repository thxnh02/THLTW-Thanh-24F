<?php

namespace App\Models;

use Database\Factories\StockDocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockDocument extends Model
{
    /** @use HasFactory<StockDocumentFactory> */
    use HasFactory;

    protected $guarded = [];

    public function items(): HasMany
    {
        return $this->hasMany(StockDocumentItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
