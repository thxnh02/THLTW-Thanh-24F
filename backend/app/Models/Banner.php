<?php

namespace App\Models;

use Database\Factories\BannerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    /** @use HasFactory<BannerFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
        ];
    }
}
