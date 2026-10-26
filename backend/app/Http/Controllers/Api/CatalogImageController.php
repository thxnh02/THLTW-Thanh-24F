<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogImage;
use Illuminate\Http\Response;

class CatalogImageController extends Controller
{
    /** GET /api/catalog-images/{catalogImage}: stream bytes saved in the database. */
    public function show(CatalogImage $catalogImage): Response
    {
        return response(base64_decode($catalogImage->content_base64, true), 200)
            ->header('Content-Type', $catalogImage->mime_type)
            ->header('Content-Length', (string) $catalogImage->byte_size)
            ->header('Cache-Control', 'no-store')
            ->header('X-Content-Type-Options', 'nosniff');
    }
}
