<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminSiteContentController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['type' => ['nullable', Rule::in(['page', 'menu', 'banner'])], 'q' => ['nullable', 'string', 'max:100']]);
        $query = SiteContent::query();
        if (! empty($data['type'])) $query->where('type', $data['type']);
        if ($term = trim($data['q'] ?? '')) {
            $like = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';
            $query->whereRaw("title LIKE ? ESCAPE '!'", [$like]);
        }
        return $query->orderBy('sort_order')->orderByDesc('id')->paginate(10)->withQueryString();
    }

    public function store(Request $request)
    {
        return response()->json(['data' => SiteContent::create($this->validated($request))], 201);
    }

    public function update(Request $request, SiteContent $content)
    {
        $content->update($this->validated($request, $content));
        return response()->json(['data' => $content->fresh()]);
    }

    public function destroy(SiteContent $content)
    {
        $content->delete();
        return response()->noContent();
    }

    private function validated(Request $request, ?SiteContent $content = null): array
    {
        $request->merge(['slug' => Str::slug((string) $request->input('slug'))]);
        return $request->validate([
            'type' => ['required', Rule::in(['page', 'menu', 'banner'])],
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['required', 'string', 'max:200', Rule::unique('site_content', 'slug')->where('type', $request->input('type'))->ignore($content?->id)],
            'body' => ['nullable', 'string', 'max:30000'],
            'href' => ['nullable', 'string', 'max:255', 'regex:~^/(?!/)[^\\\\]*$~'],
            'image' => ['nullable', 'string', 'max:500', 'regex:~^(https?://|/(?!/))[^\\s\\\\]*$~i'],
            'active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);
    }
}
