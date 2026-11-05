<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public function show()
    {
        return response()->json(['data' => SiteSetting::find(1) ?? ['shop_name' => 'CT_24F', 'shipping_fee_vnd' => (int) config('commerce.shipping_fee_vnd', 0)]]);
    }

    public function update(Request $request)
    {
        $url = ['nullable', 'string', 'max:500', 'regex:~^(https?://|/(?!/))[^\\s\\\\]*$~i'];
        $data = $request->validate([
            'shop_name' => ['required', 'string', 'max:120'],
            'contact_email' => ['nullable', 'email:rfc', 'max:254'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'logo_url' => $url, 'favicon_url' => $url,
            'social_url' => ['nullable', 'url:http,https', 'max:500'],
            'seo_title' => ['nullable', 'string', 'max:180'],
            'seo_description' => ['nullable', 'string', 'max:300'],
            'shipping_fee_vnd' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000000000'],
        ]);
        $settings = SiteSetting::updateOrCreate(['id' => 1], $data);
        return response()->json(['data' => $settings]);
    }
}
