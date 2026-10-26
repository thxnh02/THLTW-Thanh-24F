<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogImage extends Model
{
    protected $fillable = ['owner_type', 'owner_id', 'mime_type', 'byte_size', 'content_base64'];
}
