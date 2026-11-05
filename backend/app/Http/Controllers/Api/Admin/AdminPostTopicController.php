<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PostTopic;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminPostTopicController extends Controller
{
    public function index()
    {
        return PostTopic::withCount('posts')->orderBy('name')->paginate(10);
    }

    public function store(Request $request)
    {
        return response()->json(['data' => PostTopic::create($this->validated($request))], 201);
    }

    public function update(Request $request, PostTopic $topic)
    {
        $topic->update($this->validated($request, $topic));
        return response()->json(['data' => $topic->fresh()]);
    }

    public function destroy(PostTopic $topic)
    {
        if ($topic->posts()->withTrashed()->exists()) {
            throw ValidationException::withMessages(['topic' => 'Chủ đề còn bài viết, kể cả bài trong thùng rác. Hãy chuyển bài sang chủ đề khác trước.']);
        }
        $topic->delete();
        return response()->noContent();
    }

    private function validated(Request $request, ?PostTopic $topic = null): array
    {
        $request->merge(['slug' => Str::slug((string) $request->input('slug'))]);
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:150', Rule::unique('post_topics', 'slug')->ignore($topic?->id)],
        ]);
    }
}
