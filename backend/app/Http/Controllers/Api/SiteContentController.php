<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;

class SiteContentController extends Controller
{
    public function index(string $type)
    {
        abort_unless(in_array($type, ['menu', 'banner', 'page'], true), 404);
        $columns = $type === 'page' ? ['title', 'slug'] : ['title', 'slug', 'body', 'href', 'image'];
        return response()->json(['data' => SiteContent::where('type', $type)->where('active', true)->orderBy('sort_order')->orderBy('id')->get($columns)]);
    }

    public function page(string $slug)
    {
        return response()->json(['data' => SiteContent::where('type', 'page')->where('active', true)->where('slug', $slug)->firstOrFail(['title', 'slug', 'body'])]);
    }
}
