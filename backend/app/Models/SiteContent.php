<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $table = 'site_content';
    protected $fillable = ['type', 'title', 'slug', 'body', 'href', 'image', 'active', 'sort_order'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }
}
